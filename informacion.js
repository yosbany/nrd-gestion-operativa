// Company information management

// Load company information
async function loadInformacion() {
  const informacionView = document.getElementById('informacion-view');
  if (!informacionView) return;

  showSpinner('Cargando información...');
  try {
    const snapshot = await getCompanyInfo();
    const companyInfo = snapshot.val() || {};

    const missionInput = document.getElementById('company-mission');
    const visionInput = document.getElementById('company-vision');

    if (missionInput) {
      missionInput.value = companyInfo.mission || '';
    }
    if (visionInput) {
      visionInput.value = companyInfo.vision || '';
    }

    hideSpinner();
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar información: ' + error.message);
    console.error('Error loading company info:', error);
  }
}

// Company info form submit
const companyInfoForm = document.getElementById('company-info-form');
if (companyInfoForm) {
  companyInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mission = document.getElementById('company-mission').value.trim();
    const vision = document.getElementById('company-vision').value.trim();

    showSpinner('Guardando información...');
    try {
      await updateCompanyInfo({
        mission: mission || null,
        vision: vision || null
      });
      hideSpinner();
      await showSuccess('Información guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar información: ' + error.message);
      console.error('Error saving company info:', error);
    }
  });
}
