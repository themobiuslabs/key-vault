use std::sync::Mutex;

pub struct VaultState {
    vek: Mutex<Option<[u8; 32]>>,
}

impl VaultState {
    pub fn new() -> Self {
        Self {
            vek: Mutex::new(None),
        }
    }

    pub fn unlock(&self, vek: [u8; 32]) -> Result<(), String> {
        let mut stored_vek = self
            .vek
            .lock()
            .map_err(|_| "Failed to access vault state".to_string())?;

        *stored_vek = Some(vek);

        Ok(())
    }

    pub fn lock(&self) -> Result<(), String> {
        let mut stored_vek = self
            .vek
            .lock()
            .map_err(|_| "Failed to access vault state".to_string())?;

        *stored_vek = None;

        Ok(())
    }

    pub fn is_unlocked(&self) -> Result<bool, String> {
        let stored_vek = self
            .vek
            .lock()
            .map_err(|_| "Failed to access vault state".to_string())?;

        Ok(stored_vek.is_some())
    }

    pub fn get_vek(&self) -> Result<[u8; 32], String> {
        let stored_vek = self
            .vek
            .lock()
            .map_err(|_| "Failed to access vault state".to_string())?;

        stored_vek
            .as_ref()
            .copied()
            .ok_or_else(|| "Vault is locked".to_string())
    }
}