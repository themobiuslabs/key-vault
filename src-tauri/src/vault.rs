use std::sync::Mutex;
use zeroize::Zeroize;

pub struct VaultState {
    vek: Mutex<Option<[u8; 32]>>,
}

impl VaultState {
    pub fn new() -> Self {
        Self {
            vek: Mutex::new(None),
        }
    }

    pub fn unlock(
        &self,
        vek: [u8; 32],
    ) -> Result<(), String> {
        let mut stored_vek = self
            .vek
            .lock()
            .map_err(|_| {
                "Failed to access vault state".to_string()
            })?;

        if let Some(mut old_vek) = stored_vek.take() {
            old_vek.zeroize();
        }

        *stored_vek = Some(vek);

        Ok(())
    }

    pub fn lock(&self) -> Result<(), String> {
        let mut stored_vek = self
            .vek
            .lock()
            .map_err(|_| {
                "Failed to access vault state".to_string()
            })?;

        if let Some(mut vek) = stored_vek.take() {
            vek.zeroize();
        }

        Ok(())
    }

    pub fn is_unlocked(&self) -> Result<bool, String> {
        let stored_vek = self
            .vek
            .lock()
            .map_err(|_| {
                "Failed to access vault state".to_string()
            })?;

        Ok(stored_vek.is_some())
    }

    pub fn get_vek(&self) -> Result<[u8; 32], String> {
        let stored_vek = self
            .vek
            .lock()
            .map_err(|_| {
                "Failed to access vault state".to_string()
            })?;

        stored_vek
            .as_ref()
            .copied()
            .ok_or_else(|| "Vault is locked".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vault_starts_locked() {
        let vault = VaultState::new();

        assert!(
            !vault.is_unlocked()
                .expect("vault state should be accessible")
        );
    }

    #[test]
    fn vault_unlock_stores_vek() {
        let vault = VaultState::new();
        let vek = [42u8; 32];

        vault
            .unlock(vek)
            .expect("unlock should succeed");

        assert!(
            vault
                .is_unlocked()
                .expect("vault state should be accessible")
        );

        assert_eq!(
            vault
                .get_vek()
                .expect("VEK should be available"),
            vek
        );
    }

    #[test]
    fn vault_lock_removes_vek() {
        let vault = VaultState::new();
        let vek = [42u8; 32];

        vault
            .unlock(vek)
            .expect("unlock should succeed");

        vault
            .lock()
            .expect("lock should succeed");

        assert!(
            !vault
                .is_unlocked()
                .expect("vault state should be accessible")
        );

        assert!(
            vault.get_vek().is_err(),
            "VEK should not be available after locking"
        );
    }

    #[test]
    fn unlocking_again_replaces_existing_vek() {
        let vault = VaultState::new();

        let first_vek = [1u8; 32];
        let second_vek = [2u8; 32];

        vault
            .unlock(first_vek)
            .expect("first unlock should succeed");

        assert_eq!(
            vault
                .get_vek()
                .expect("first VEK should be available"),
            first_vek
        );

        vault
            .unlock(second_vek)
            .expect("second unlock should succeed");

        assert_eq!(
            vault
                .get_vek()
                .expect("second VEK should be available"),
            second_vek
        );
    }

}