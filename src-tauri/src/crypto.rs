use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use argon2::{
    Algorithm,
    Argon2,
    Params,
    Version,
};
use rand::RngCore;

use crate::CreateCredential;

pub fn generate_vault_key() -> [u8; 32] {
    let mut vek = [0u8; 32];

    rand::rngs::OsRng.fill_bytes(&mut vek);

    vek
}

pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];

    rand::rngs::OsRng.fill_bytes(&mut salt);

    salt
}

pub fn generate_recovery_key() -> [u8; 32] {
    let mut recovery_key = [0u8; 32];

    rand::rngs::OsRng.fill_bytes(
        &mut recovery_key
    );

    recovery_key
}

pub fn derive_kek(
    password: &str,
    salt: &[u8; 16],
) -> Result<[u8; 32], String> {
    let params = Params::new(
        19 * 1024,
        2,
        1,
        Some(32),
    )
    .map_err(|error| error.to_string())?;

    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        params,
    );

    let mut kek = [0u8; 32];

    argon2
        .hash_password_into(
            password.as_bytes(),
            salt,
            &mut kek,
        )
        .map_err(|error| error.to_string())?;

    Ok(kek)
}

pub fn derive_recovery_kek(
    recovery_key: &[u8; 32],
    salt: &[u8; 16],
) -> Result<[u8; 32], String> {
    let params = Params::new(
        19 * 1024,
        2,
        1,
        Some(32),
    )
    .map_err(|error| error.to_string())?;

    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        params,
    );

    let mut kek = [0u8; 32];

    argon2
        .hash_password_into(
            recovery_key,
            salt,
            &mut kek,
        )
        .map_err(|error| error.to_string())?;

    Ok(kek)
}

pub fn wrap_vault_key(
    kek: &[u8; 32],
    vek: &[u8; 32],
) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(kek);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];

    rand::rngs::OsRng.fill_bytes(
        &mut nonce_bytes
    );

    let nonce = Nonce::from_slice(
        &nonce_bytes
    );

    let ciphertext = cipher
        .encrypt(
            nonce,
            vek.as_ref(),
        )
        .map_err(|error| {
            format!(
                "Failed to wrap vault key: {error:?}"
            )
        })?;

    let mut wrapped_key = Vec::with_capacity(
        nonce_bytes.len() + ciphertext.len()
    );

    wrapped_key.extend_from_slice(
        &nonce_bytes
    );

    wrapped_key.extend_from_slice(
        &ciphertext
    );

    Ok(wrapped_key)
}

pub fn unwrap_vault_key(
    kek: &[u8; 32],
    wrapped_key: &[u8],
) -> Result<[u8; 32], String> {
    if wrapped_key.len() < 12 {
        return Err(
            "Invalid wrapped vault key".to_string()
        );
    }

    let nonce_bytes = &wrapped_key[..12];
    let ciphertext = &wrapped_key[12..];

    let key = Key::<Aes256Gcm>::from_slice(
        kek
    );

    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(
        nonce_bytes
    );

    let plaintext = cipher
        .decrypt(
            nonce,
            ciphertext,
        )
        .map_err(|error| {
            format!(
                "Failed to unwrap vault key: {error:?}"
            )
        })?;

    if plaintext.len() != 32 {
        return Err(
            "Invalid vault key length".to_string()
        );
    }

    let mut vek = [0u8; 32];

    vek.copy_from_slice(&plaintext);

    Ok(vek)
}

pub fn encrypt_credential(
    vek: &[u8; 32],
    credential_id: &str,
    credential: &CreateCredential,
) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(vek);
    let cipher = Aes256Gcm::new(key);

    let plaintext = serde_json::to_vec(
        credential
    )
    .map_err(|error| error.to_string())?;

    let mut nonce_bytes = [0u8; 12];

    rand::rngs::OsRng.fill_bytes(
        &mut nonce_bytes
    );

    let nonce = Nonce::from_slice(
        &nonce_bytes
    );

    let ciphertext = cipher
        .encrypt(
            nonce,
            aes_gcm::aead::Payload {
                msg: plaintext.as_ref(),
                aad: credential_id.as_bytes(),
            },
        )
        .map_err(|error| {
            format!(
                "Failed to encrypt credential: {error:?}"
            )
        })?;

    let mut encrypted_data = Vec::with_capacity(
        nonce_bytes.len() + ciphertext.len()
    );

    encrypted_data.extend_from_slice(
        &nonce_bytes
    );

    encrypted_data.extend_from_slice(
        &ciphertext
    );

    Ok(encrypted_data)
}

pub fn decrypt_credential(
    vek: &[u8; 32],
    credential_id: &str,
    encrypted_data: &[u8],
) -> Result<CreateCredential, String> {
    if encrypted_data.len() < 12 {
        return Err(
            "Invalid encrypted credential data"
                .to_string()
        );
    }

    let nonce_bytes = &encrypted_data[..12];
    let ciphertext = &encrypted_data[12..];

    let key = Key::<Aes256Gcm>::from_slice(
        vek
    );

    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(
        nonce_bytes
    );

    let plaintext = cipher
        .decrypt(
            nonce,
            aes_gcm::aead::Payload {
                msg: ciphertext,
                aad: credential_id.as_bytes(),
            },
        )
        .map_err(|error| {
            format!(
                "Failed to decrypt credential: {error:?}"
            )
        })?;

    serde_json::from_slice(&plaintext)
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encryption_round_trip() {
        let vek = generate_vault_key();

        let credential = CreateCredential {
            title: "Test Credential".to_string(),
            provider: "Test Provider".to_string(),
            credential_type: "API Key".to_string(),
            api_key: "test-api-key".to_string(),
            secret_key: Some("test-secret-key".to_string()),
            notes: Some("test notes".to_string()),
            tags: vec![
                "test".to_string(),
                "development".to_string(),
            ],
        };

        let credential_id =
            "test-credential-id";

        let encrypted = encrypt_credential(
            &vek,
            credential_id,
            &credential,
        )
        .expect("encryption should succeed");

        let decrypted = decrypt_credential(
            &vek,
            credential_id,
            &encrypted,
        )
        .expect("decryption should succeed");

        assert_eq!(
            decrypted.title,
            credential.title
        );
        assert_eq!(
            decrypted.provider,
            credential.provider
        );
        assert_eq!(
            decrypted.credential_type,
            credential.credential_type
        );
        assert_eq!(
            decrypted.api_key,
            credential.api_key
        );
        assert_eq!(
            decrypted.secret_key,
            credential.secret_key
        );
        assert_eq!(
            decrypted.notes,
            credential.notes
        );
        assert_eq!(
            decrypted.tags,
            credential.tags
        );
    }

    #[test]
    fn encryption_fails_with_wrong_key() {
        let vek = generate_vault_key();
        let wrong_vek = generate_vault_key();

        let credential = CreateCredential {
            title: "Test Credential".to_string(),
            provider: "Test Provider".to_string(),
            credential_type: "API Key".to_string(),
            api_key: "test-api-key".to_string(),
            secret_key: None,
            notes: None,
            tags: vec![],
        };

        let credential_id = "test-credential-id";

        let encrypted = encrypt_credential(
            &vek,
            credential_id,
            &credential,
        )
        .expect("encryption should succeed");

        let result = decrypt_credential(
            &wrong_vek,
            credential_id,
            &encrypted,
        );

        assert!(
            result.is_err(),
            "decryption should fail with the wrong key"
        );
    }

    #[test]
    fn decryption_fails_when_ciphertext_is_tampered() {
        let vek = generate_vault_key();

        let credential = CreateCredential {
            title: "Test Credential".to_string(),
            provider: "Test Provider".to_string(),
            credential_type: "API Key".to_string(),
            api_key: "test-api-key".to_string(),
            secret_key: None,
            notes: None,
            tags: vec![],
        };

        let credential_id = "test-credential-id";

        let mut encrypted = encrypt_credential(
            &vek,
            credential_id,
            &credential,
        )
        .expect("encryption should succeed");

        // Modify one byte of the encrypted payload.
        encrypted[12] ^= 1;

        let result = decrypt_credential(
            &vek,
            credential_id,
            &encrypted,
        );

        assert!(
            result.is_err(),
            "decryption should fail when ciphertext is tampered with"
        );
    }

    #[test]
    fn decryption_fails_with_wrong_credential_id() {
        let vek = generate_vault_key();

        let credential = CreateCredential {
            title: "Test Credential".to_string(),
            provider: "Test Provider".to_string(),
            credential_type: "API Key".to_string(),
            api_key: "test-api-key".to_string(),
            secret_key: None,
            notes: None,
            tags: vec![],
        };

        let original_id = "credential-a";
        let wrong_id = "credential-b";

        let encrypted = encrypt_credential(
            &vek,
            original_id,
            &credential,
        )
        .expect("encryption should succeed");

        let result = decrypt_credential(
            &vek,
            wrong_id,
            &encrypted,
        );

        assert!(
            result.is_err(),
            "decryption should fail with the wrong credential ID"
        );
    }

    #[test]
    fn vault_key_wrap_round_trip() {
        let vek = generate_vault_key();
        let salt = generate_salt();

        let kek = derive_kek(
            "test-master-password",
            &salt,
        )
        .expect("key derivation should succeed");

        let wrapped = wrap_vault_key(
            &kek,
            &vek,
        )
        .expect("wrapping should succeed");

        let unwrapped = unwrap_vault_key(
            &kek,
            &wrapped,
        )
        .expect("unwrapping should succeed");

        assert_eq!(
            vek,
            unwrapped,
            "unwrapped VEK should match the original"
        );
    }

    #[test]
    fn vault_key_unwrap_fails_with_wrong_password() {
        let vek = generate_vault_key();
        let salt = generate_salt();

        let correct_kek = derive_kek(
            "correct-password",
            &salt,
        )
        .expect("key derivation should succeed");

        let wrong_kek = derive_kek(
            "wrong-password",
            &salt,
        )
        .expect("key derivation should succeed");

        let wrapped = wrap_vault_key(
            &correct_kek,
            &vek,
        )
        .expect("wrapping should succeed");

        let result = unwrap_vault_key(
            &wrong_kek,
            &wrapped,
        );

        assert!(
            result.is_err(),
            "unwrapping should fail with the wrong password"
        );
    }

    #[test]
    fn recovery_key_wrap_round_trip() {
        let vek = generate_vault_key();
        let recovery_key = generate_recovery_key();
        let salt = generate_salt();

        let recovery_kek = derive_recovery_kek(
            &recovery_key,
            &salt,
        )
        .expect("recovery key derivation should succeed");

        let wrapped = wrap_vault_key(
            &recovery_kek,
            &vek,
        )
        .expect("wrapping should succeed");

        let unwrapped = unwrap_vault_key(
            &recovery_kek,
            &wrapped,
        )
        .expect("unwrapping should succeed");

        assert_eq!(
            vek,
            unwrapped,
            "unwrapped VEK should match the original"
        );
    }

    #[test]
    fn recovery_key_unwrap_fails_with_wrong_key() {
        let vek = generate_vault_key();
        let recovery_key = generate_recovery_key();
        let wrong_recovery_key = generate_recovery_key();
        let salt = generate_salt();

        let recovery_kek = derive_recovery_kek(
            &recovery_key,
            &salt,
        )
        .expect("recovery key derivation should succeed");

        let wrong_recovery_kek = derive_recovery_kek(
            &wrong_recovery_key,
            &salt,
        )
        .expect("recovery key derivation should succeed");

        let wrapped = wrap_vault_key(
            &recovery_kek,
            &vek,
        )
        .expect("wrapping should succeed");

        let result = unwrap_vault_key(
            &wrong_recovery_kek,
            &wrapped,
        );

        assert!(
            result.is_err(),
            "unwrapping should fail with the wrong recovery key"
        );
    }

}
