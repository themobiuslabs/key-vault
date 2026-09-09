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

pub fn wrap_vault_key(
    kek: &[u8; 32],
    vek: &[u8; 32],
) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(kek);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];

    rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, vek.as_ref())
        .map_err(|error| {
            format!(
                "Failed to wrap vault key: {error:?}"
            )
        })?;

    let mut wrapped_key = Vec::with_capacity(
        nonce_bytes.len() + ciphertext.len(),
    );

    wrapped_key.extend_from_slice(&nonce_bytes);
    wrapped_key.extend_from_slice(&ciphertext);

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

    let key = Key::<Aes256Gcm>::from_slice(kek);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
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

    let plaintext = serde_json::to_vec(credential)
        .map_err(|error| error.to_string())?;

    let mut nonce_bytes = [0u8; 12];

    rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);

    let nonce = Nonce::from_slice(&nonce_bytes);

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
        nonce_bytes.len() + ciphertext.len(),
    );

    encrypted_data.extend_from_slice(&nonce_bytes);
    encrypted_data.extend_from_slice(&ciphertext);

    Ok(encrypted_data)
}

pub fn decrypt_credential(
    vek: &[u8; 32],
    credential_id: &str,
    encrypted_data: &[u8],
) -> Result<CreateCredential, String> {
    if encrypted_data.len() < 12 {
        return Err(
            "Invalid encrypted credential data".to_string()
        );
    }

    let nonce_bytes = &encrypted_data[..12];
    let ciphertext = &encrypted_data[12..];

    let key = Key::<Aes256Gcm>::from_slice(vek);
    let cipher = Aes256Gcm::new(key);

    let nonce = Nonce::from_slice(nonce_bytes);

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