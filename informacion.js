// Company information management

let isEditMode = false;

// Load company information
async function loadInformacion() {
  const informacionView = document.getElementById('informacion-view');
  if (!informacionView) return;

  showSpinner('Cargando información...');
  try {
    const snapshot = await getCompanyInfo();
    const companyInfo = snapshot.val() || {};

    // Show read mode
    showReadMode(companyInfo);

    hideSpinner();
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar información: ' + error.message);
    console.error('Error loading company info:', error);
  }
}

// Show read mode
function showReadMode(companyInfo) {
  isEditMode = false;
  
  const readMode = document.getElementById('company-info-read-mode');
  const editMode = document.getElementById('company-info-form');
  
  if (readMode) readMode.classList.remove('hidden');
  if (editMode) editMode.classList.add('hidden');

  // Update read mode fields
  const legalNameRead = document.getElementById('company-legal-name-read');
  const tradeNameRead = document.getElementById('company-trade-name-read');
  const rutRead = document.getElementById('company-rut-read');
  const addressRead = document.getElementById('company-address-read');
  const phoneRead = document.getElementById('company-phone-read');
  const mobileRead = document.getElementById('company-mobile-read');
  const emailRead = document.getElementById('company-email-read');
  const missionRead = document.getElementById('company-mission-read');
  const visionRead = document.getElementById('company-vision-read');

  if (legalNameRead) legalNameRead.textContent = companyInfo.legalName || '-';
  if (tradeNameRead) tradeNameRead.textContent = companyInfo.tradeName || '-';
  if (rutRead) rutRead.textContent = companyInfo.rut || '-';
  if (addressRead) addressRead.textContent = companyInfo.address || '-';
  if (phoneRead) phoneRead.textContent = companyInfo.phone || '-';
  if (mobileRead) mobileRead.textContent = companyInfo.mobile || '-';
  if (emailRead) emailRead.textContent = companyInfo.email || '-';
  if (missionRead) missionRead.textContent = companyInfo.mission || '-';
  if (visionRead) visionRead.textContent = companyInfo.vision || '-';
}

// Show edit mode
function showEditMode(companyInfo) {
  isEditMode = true;
  
  const readMode = document.getElementById('company-info-read-mode');
  const editMode = document.getElementById('company-info-form');
  
  if (readMode) readMode.classList.add('hidden');
  if (editMode) editMode.classList.remove('hidden');

  // Load values into edit inputs
  const legalNameInput = document.getElementById('company-legal-name');
  const tradeNameInput = document.getElementById('company-trade-name');
  const rutInput = document.getElementById('company-rut');
  const addressInput = document.getElementById('company-address');
  const phoneInput = document.getElementById('company-phone');
  const mobileInput = document.getElementById('company-mobile');
  const emailInput = document.getElementById('company-email');
  const missionInput = document.getElementById('company-mission');
  const visionInput = document.getElementById('company-vision');

  if (legalNameInput) legalNameInput.value = companyInfo.legalName || '';
  if (tradeNameInput) tradeNameInput.value = companyInfo.tradeName || '';
  if (rutInput) rutInput.value = companyInfo.rut || '';
  if (addressInput) addressInput.value = companyInfo.address || '';
  if (phoneInput) phoneInput.value = companyInfo.phone || '';
  if (mobileInput) mobileInput.value = companyInfo.mobile || '';
  if (emailInput) emailInput.value = companyInfo.email || '';
  if (missionInput) missionInput.value = companyInfo.mission || '';
  if (visionInput) visionInput.value = companyInfo.vision || '';
}

// Edit button handler
const editCompanyInfoBtn = document.getElementById('edit-company-info-btn');
if (editCompanyInfoBtn) {
  editCompanyInfoBtn.addEventListener('click', async () => {
    try {
      const snapshot = await getCompanyInfo();
      const companyInfo = snapshot.val() || {};
      showEditMode(companyInfo);
    } catch (error) {
      await showError('Error al cargar información: ' + error.message);
      console.error('Error loading company info:', error);
    }
  });
}

// Cancel edit button handler
const cancelEditCompanyInfoBtn = document.getElementById('cancel-edit-company-info-btn');
if (cancelEditCompanyInfoBtn) {
  cancelEditCompanyInfoBtn.addEventListener('click', async () => {
    try {
      const snapshot = await getCompanyInfo();
      const companyInfo = snapshot.val() || {};
      showReadMode(companyInfo);
    } catch (error) {
      await showError('Error al cargar información: ' + error.message);
      console.error('Error loading company info:', error);
    }
  });
}

// Company info form submit
const companyInfoForm = document.getElementById('company-info-form');
if (companyInfoForm) {
  companyInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const legalName = document.getElementById('company-legal-name').value.trim();
    const tradeName = document.getElementById('company-trade-name').value.trim();
    const rut = document.getElementById('company-rut').value.trim();
    const address = document.getElementById('company-address').value.trim();
    const phone = document.getElementById('company-phone').value.trim();
    const mobile = document.getElementById('company-mobile').value.trim();
    const email = document.getElementById('company-email').value.trim();
    const mission = document.getElementById('company-mission').value.trim();
    const vision = document.getElementById('company-vision').value.trim();

    showSpinner('Guardando información...');
    try {
      const updatedInfo = {
        legalName: legalName || null,
        tradeName: tradeName || null,
        rut: rut || null,
        address: address || null,
        phone: phone || null,
        mobile: mobile || null,
        email: email || null,
        mission: mission || null,
        vision: vision || null
      };
      
      await updateCompanyInfo(updatedInfo);
      hideSpinner();
      await showSuccess('Información guardada exitosamente');
      
      // Return to read mode
      showReadMode(updatedInfo);
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar información: ' + error.message);
      console.error('Error saving company info:', error);
    }
  });
}
