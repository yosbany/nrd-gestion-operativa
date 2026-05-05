// Company information management

let isEditMode = false;

// Load company information
async function loadInformacion() {
  const informacionView = document.getElementById('informacion-view');
  if (!informacionView) return;

  showSpinner('Cargando información...');
  try {
    const [companyInfo, contracts] = await Promise.all([
      nrd.companyInfo.get(),
      window.nrd.contracts.getAll()
    ]);

    // Show read mode
    showReadMode(companyInfo, contracts);

    hideSpinner();
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar información: ' + error.message);
    console.error('Error loading company info:', error);
  }
}

// Show read mode
function showReadMode(companyInfo, contracts = {}) {
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
  
  // Display contracts
  displayContractsRead(contracts);
}

// Show edit mode
async function showEditMode(companyInfo) {
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
  
  // Load contracts for editing
  const contracts = await window.nrd.contracts.getAll();
  displayContractsEdit(contracts);
}

// Edit button handler
const editCompanyInfoBtn = document.getElementById('edit-company-info-btn');
if (editCompanyInfoBtn) {
  editCompanyInfoBtn.addEventListener('click', async () => {
    try {
      const companyInfo = await nrd.companyInfo.get();
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
      const [companyInfo, contracts] = await Promise.all([
        nrd.companyInfo.get(),
        window.nrd.contracts.getAll()
      ]);
      showReadMode(companyInfo, contracts);
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
      
      await nrd.companyInfo.set(updatedInfo);
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

// Generate PDF with all company information
async function generateCompanyPDF() {
  showSpinner('Generando PDF...');
  try {
    // Load all data
    const [companyInfo, areas, processes, tasks, roles, employees] = await Promise.all([
      nrd.companyInfo.get(),
      nrd.areas.getAll(),
      nrd.processes.getAll(),
      nrd.tasks.getAll(),
      nrd.roles.getAll(),
      nrd.employees.getAll()
    ]);

    hideSpinner();

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add text with word wrap
    function addText(text, fontSize = 10, isBold = false, color = [0, 0, 0]) {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const lines = doc.splitTextToSize(text || '-', maxWidth);
      lines.forEach(line => {
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
    }

    // Helper function to add section title
    function addSectionTitle(title) {
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += sectionSpacing;
      }
      addText(title, 14, true, [220, 38, 38]);
      yPos += 3;
    }

    // Company Information
    addSectionTitle('INFORMACIÓN DE LA EMPRESA');
    addText('Razón Social: ' + (companyInfo.legalName || '-'), 10, false);
    addText('Nombre Fantasía: ' + (companyInfo.tradeName || '-'), 10, false);
    addText('Número de Rut: ' + (companyInfo.rut || '-'), 10, false);
    addText('Dirección Fiscal: ' + (companyInfo.address || '-'), 10, false);
    addText('Teléfono: ' + (companyInfo.phone || '-'), 10, false);
    addText('Celular: ' + (companyInfo.mobile || '-'), 10, false);
    addText('Correo Electrónico: ' + (companyInfo.email || '-'), 10, false);
    yPos += 2;
    addText('Misión:', 10, true);
    addText(companyInfo.mission || '-', 10, false);
    yPos += 2;
    addText('Visión:', 10, true);
    addText(companyInfo.vision || '-', 10, false);

    // Areas
    if (Object.keys(areas).length > 0) {
      addSectionTitle('ÁREAS OPERATIVAS');
      Object.entries(areas).forEach(([id, area]) => {
        addText(area.name || 'Sin nombre', 11, true);
        if (area.description) {
          addText(area.description, 9, false);
        }
        yPos += 2;
      });
    }

    // Roles
    if (Object.keys(roles).length > 0) {
      addSectionTitle('ROLES');
      Object.entries(roles).forEach(([id, role]) => {
        addText(role.name || 'Sin nombre', 11, true);
        if (role.description) {
          addText(role.description, 9, false);
        }
        yPos += 2;
      });
    }

    // Employees
    if (Object.keys(employees).length > 0) {
      addSectionTitle('EMPLEADOS');
      Object.entries(employees).forEach(([id, employee]) => {
        const roleIds = employee.roleIds || (employee.roleId ? [employee.roleId] : []);
        const roleNames = roleIds.map(roleId => roles[roleId] ? roles[roleId].name : null).filter(n => n !== null);
        const roleName = roleNames.length > 0 ? roleNames.join(', ') : 'Sin roles';
        addText(employee.name || 'Sin nombre', 11, true);
        addText('Roles: ' + roleName, 9, false);
        if (employee.email) addText('Email: ' + employee.email, 9, false);
        if (employee.phone) addText('Teléfono: ' + employee.phone, 9, false);
        if (employee.salary) addText('Costo Salarial: $' + parseFloat(employee.salary).toFixed(2), 9, false);
        yPos += 2;
      });
    }

    // Processes
    if (Object.keys(processes).length > 0) {
      addSectionTitle('PROCESOS');
      Object.entries(processes).forEach(([id, process]) => {
        const areaName = process.areaId && areas[process.areaId] ? areas[process.areaId].name : 'Sin área';
        addText(process.name || 'Sin nombre', 11, true);
        addText('Área: ' + areaName, 9, false);
        if (process.objective) {
          addText('Objetivo: ' + process.objective, 9, false);
        }
        
        // Get tasks for this process
        const processTasks = Object.entries(tasks)
          .filter(([taskId, task]) => task.processId === id)
          .map(([taskId, task]) => ({ id: taskId, ...task }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (processTasks.length > 0) {
          addText('Tareas del proceso:', 9, true);
          processTasks.forEach((task, index) => {
            const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
            const roleNames = taskRoleIds.map(rid => roles[rid] ? roles[rid].name : null).filter(n => n !== null);
            const roleName = roleNames.length > 0 ? roleNames.join(', ') : 'Sin rol';
            addText(`${index + 1}. ${task.name || 'Sin nombre'}`, 9, false);
            addText(`   Roles: ${roleName}`, 8, false);
            if (task.frequency) addText(`   Frecuencia: ${task.frequency}`, 8, false);
            if (task.estimatedTime) addText(`   Tiempo estimado: ${task.estimatedTime} min`, 8, false);
          });
        }
        yPos += 2;
      });
    }

    // Tasks (all tasks)
    if (Object.keys(tasks).length > 0) {
      addSectionTitle('TAREAS');
      Object.entries(tasks).forEach(([id, task]) => {
        const processName = task.processId && processes[task.processId] ? processes[task.processId].name : 'Sin proceso';
        const taskRoleIds = task.roleIds || (task.roleId ? [task.roleId] : []);
        const roleNames = taskRoleIds.map(rid => roles[rid] ? roles[rid].name : null).filter(n => n !== null);
        const roleName = roleNames.length > 0 ? roleNames.join(', ') : 'Sin rol';
        
        addText(task.name || 'Sin nombre', 11, true);
        addText('Proceso: ' + processName, 9, false);
        addText('Roles: ' + roleName, 9, false);
        if (task.description) addText('Descripción: ' + task.description, 9, false);
        if (task.frequency) addText('Frecuencia: ' + task.frequency, 9, false);
        if (task.estimatedTime) addText('Tiempo estimado: ' + task.estimatedTime + ' min', 9, false);
        if (task.cost) addText('Costo/Pago: $' + parseFloat(task.cost).toFixed(2), 9, false);
        
        if (task.executionSteps && task.executionSteps.length > 0) {
          addText('Pasos de ejecución:', 9, true);
          task.executionSteps.forEach((step, index) => {
            addText(`${index + 1}. ${step}`, 8, false);
          });
        }
        
        if (task.successCriteria && (Array.isArray(task.successCriteria) ? task.successCriteria.length > 0 : task.successCriteria)) {
          addText('Criterios de éxito:', 9, true);
          if (Array.isArray(task.successCriteria)) {
            task.successCriteria.forEach((criterion, idx) => {
              addText(`${idx + 1}. ${criterion}`, 8, false);
            });
          } else {
            addText('• ' + task.successCriteria, 8, false);
          }
        }
        
        if (task.commonErrors && task.commonErrors.length > 0) {
          addText('Errores comunes:', 9, true);
          task.commonErrors.forEach(error => {
            addText('• ' + error, 8, false);
          });
        }
        yPos += 2;
      });
    }

    // Generate filename
    const companyName = companyInfo.tradeName || companyInfo.legalName || 'Empresa';
    const date = new Date().toLocaleDateString('es-ES');
    const filename = `Informacion_${companyName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;

    // Save PDF
    doc.save(filename);
  } catch (error) {
    hideSpinner();
    await showError('Error al generar PDF: ' + error.message);
    console.error('Error generating PDF:', error);
  }
}

// Print PDF button handler
const printCompanyPdfBtn = document.getElementById('print-company-pdf-btn');
if (printCompanyPdfBtn) {
  printCompanyPdfBtn.addEventListener('click', () => {
    generateCompanyPDF();
  });
}

// ========== CONTRACTS AND PERMITS MANAGEMENT ==========

// Display contracts in read mode
function displayContractsRead(contracts) {
  const contractsList = document.getElementById('contracts-list');
  if (!contractsList) return;
  
  contractsList.innerHTML = '';
  
  if (Object.keys(contracts).length === 0) {
    contractsList.innerHTML = '<p class="text-sm text-gray-500 italic">No hay contratos o habilitaciones registrados</p>';
    return;
  }
  
  Object.entries(contracts).forEach(([contractId, contract]) => {
    const contractDiv = document.createElement('div');
    contractDiv.className = 'border border-gray-200 p-4 sm:p-6';
    contractDiv.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg sm:text-xl font-light">${escapeHtml(contract.name || 'Sin nombre')}</h3>
      </div>
      ${contract.description ? `
        <div class="mb-3">
          <p class="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">${escapeHtml(contract.description)}</p>
        </div>
      ` : ''}
      ${contract.importantData && Object.keys(contract.importantData).length > 0 ? `
        <div class="mb-3 pt-3 border-t border-gray-200">
          <h4 class="text-sm uppercase tracking-wider text-gray-600 mb-2">Datos Importantes:</h4>
          <div class="space-y-1">
            ${Object.entries(contract.importantData).map(([key, value]) => `
              <div class="flex text-sm">
                <span class="font-medium text-gray-600 w-1/3">${escapeHtml(key)}:</span>
                <span class="text-gray-800 flex-1">${escapeHtml(value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${contract.documents && contract.documents.length > 0 ? `
        <div class="pt-3 border-t border-gray-200">
          <h4 class="text-sm uppercase tracking-wider text-gray-600 mb-2">Documentos:</h4>
          <div class="space-y-2">
            ${contract.documents.map((doc, index) => `
              <div class="flex items-center gap-2">
                <a href="${doc.data}" download="${doc.name}" class="text-sm text-red-600 hover:text-red-700 underline">
                  📄 ${escapeHtml(doc.name)}
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    contractsList.appendChild(contractDiv);
  });
}

// Display contracts in edit mode
function displayContractsEdit(contracts) {
  const contractsList = document.getElementById('contracts-list-edit');
  if (!contractsList) return;
  
  contractsList.innerHTML = '';
  
  Object.entries(contracts).forEach(([contractId, contract]) => {
    contractsList.appendChild(createContractEditItem(contractId, contract));
  });
}

// Create contract edit item
function createContractEditItem(contractId, contract = {}) {
  const contractDiv = document.createElement('div');
  contractDiv.className = 'border border-gray-200 p-4 sm:p-6';
  contractDiv.dataset.contractId = contractId;
  
  const importantData = contract.importantData || {};
  const documents = contract.documents || [];
  
  contractDiv.innerHTML = `
    <div class="mb-4">
      <label class="block mb-1.5 sm:mb-2 text-xs uppercase tracking-wider text-gray-600">Nombre</label>
      <input type="text" class="contract-name w-full px-0 py-2 border-0 border-b border-gray-300 focus:outline-none focus:border-red-600 bg-transparent text-sm sm:text-base" 
        value="${escapeHtml(contract.name || '')}" placeholder="Nombre del contrato/habilitación">
    </div>
    <div class="mb-4">
      <label class="block mb-1.5 sm:mb-2 text-xs uppercase tracking-wider text-gray-600">Descripción</label>
      <textarea class="contract-description w-full px-0 py-2 border-0 border-b border-gray-300 focus:outline-none focus:border-red-600 bg-transparent resize-y text-sm sm:text-base" 
        rows="3" placeholder="Descripción...">${escapeHtml(contract.description || '')}</textarea>
    </div>
    <div class="mb-4">
      <label class="block mb-1.5 sm:mb-2 text-xs uppercase tracking-wider text-gray-600">Datos Importantes</label>
      <div class="contract-important-data space-y-2">
        ${Object.entries(importantData).map(([key, value], index) => `
          <div class="flex gap-2 items-center">
            <input type="text" class="data-key flex-1 px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 text-sm" 
              value="${escapeHtml(key)}" placeholder="Clave">
            <input type="text" class="data-value flex-1 px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 text-sm" 
              value="${escapeHtml(value)}" placeholder="Valor">
            <button type="button" class="remove-data-btn px-2 py-1 text-red-600 hover:text-red-700 text-sm" title="Eliminar">×</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="add-data-btn mt-2 px-3 py-1 text-xs border border-gray-300 hover:border-red-600 text-gray-600 hover:text-red-600">
        + Agregar Dato
      </button>
    </div>
    <div class="mb-4">
      <label class="block mb-1.5 sm:mb-2 text-xs uppercase tracking-wider text-gray-600">Documentos</label>
      <div class="contract-documents space-y-2">
        ${documents.map((doc, index) => `
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">📄 ${escapeHtml(doc.name)}</span>
            <button type="button" class="remove-document-btn px-2 py-1 text-red-600 hover:text-red-700 text-sm" data-index="${index}">Eliminar</button>
          </div>
        `).join('')}
      </div>
      <input type="file" class="contract-file-input mt-2 text-sm" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
    </div>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
      <button type="button" class="delete-contract-btn flex-1 px-4 sm:px-6 py-2 bg-red-600 text-white border border-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
        Eliminar
      </button>
      <button type="button" class="save-contract-btn flex-1 px-4 sm:px-6 py-2 bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors uppercase tracking-wider text-xs sm:text-sm font-light">
        Guardar
      </button>
    </div>
  `;
  
  // Attach event listeners
  const addDataBtn = contractDiv.querySelector('.add-data-btn');
  const removeDataBtns = contractDiv.querySelectorAll('.remove-data-btn');
  const fileInput = contractDiv.querySelector('.contract-file-input');
  const removeDocumentBtns = contractDiv.querySelectorAll('.remove-document-btn');
  const saveBtn = contractDiv.querySelector('.save-contract-btn');
  const deleteBtn = contractDiv.querySelector('.delete-contract-btn');
  
  if (addDataBtn) {
    addDataBtn.addEventListener('click', () => {
      const dataContainer = contractDiv.querySelector('.contract-important-data');
      const newDataDiv = document.createElement('div');
      newDataDiv.className = 'flex gap-2 items-center';
      newDataDiv.innerHTML = `
        <input type="text" class="data-key flex-1 px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 text-sm" placeholder="Clave">
        <input type="text" class="data-value flex-1 px-2 py-1 border border-gray-300 focus:outline-none focus:border-red-600 text-sm" placeholder="Valor">
        <button type="button" class="remove-data-btn px-2 py-1 text-red-600 hover:text-red-700 text-sm" title="Eliminar">×</button>
      `;
      newDataDiv.querySelector('.remove-data-btn').addEventListener('click', () => {
        newDataDiv.remove();
      });
      dataContainer.appendChild(newDataDiv);
    });
  }
  
  removeDataBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.flex').remove();
    });
  });
  
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const documentsContainer = contractDiv.querySelector('.contract-documents');
        const docDiv = document.createElement('div');
        docDiv.className = 'flex items-center gap-2';
        docDiv.innerHTML = `
          <span class="text-sm text-gray-700">📄 ${escapeHtml(file.name)}</span>
          <button type="button" class="remove-document-btn px-2 py-1 text-red-600 hover:text-red-700 text-sm" data-temp-index="${documents.length}">Eliminar</button>
        `;
        docDiv.querySelector('.remove-document-btn').addEventListener('click', function() {
          docDiv.remove();
        });
        documentsContainer.appendChild(docDiv);
        
        // Store base64 in data attribute
        docDiv.dataset.base64 = base64;
        docDiv.dataset.fileName = file.name;
      }
      e.target.value = '';
    });
  }
  
  removeDocumentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.flex').remove();
    });
  });
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await saveContract(contractDiv);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      await deleteContractHandler(contractId);
    });
  }
  
  return contractDiv;
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Save contract
async function saveContract(contractDiv) {
  const contractId = contractDiv.dataset.contractId;
  const name = contractDiv.querySelector('.contract-name').value.trim();
  const description = contractDiv.querySelector('.contract-description').value.trim();
  
  // Collect important data
  const importantData = {};
  contractDiv.querySelectorAll('.contract-important-data .flex').forEach(dataRow => {
    const key = dataRow.querySelector('.data-key').value.trim();
    const value = dataRow.querySelector('.data-value').value.trim();
    if (key && value) {
      importantData[key] = value;
    }
  });
  
  // Collect documents
  const newDocuments = [];
  const existingDocumentIndices = [];
  
  contractDiv.querySelectorAll('.contract-documents .flex').forEach(docDiv => {
    if (docDiv.dataset.base64) {
      // New document
      newDocuments.push({
        name: docDiv.dataset.fileName,
        data: docDiv.dataset.base64
      });
    } else {
      // Existing document - check if it has data-index
      const removeBtn = docDiv.querySelector('.remove-document-btn');
      if (removeBtn && removeBtn.dataset.index !== undefined) {
        existingDocumentIndices.push(parseInt(removeBtn.dataset.index));
      }
    }
  });
  
  if (!name) {
    await showError('Por favor ingrese un nombre para el contrato/habilitación');
    return;
  }
  
  showSpinner('Guardando contrato/habilitación...');
  try {
    const contractData = {
      name,
      description: description || null,
      importantData: Object.keys(importantData).length > 0 ? importantData : null,
      documents: null
    };
    
    if (contractId && contractId !== 'new') {
      // Load existing documents and merge
      const existing = await window.nrd.contracts.getById(contractId);
      if (existing && existing.documents) {
        // Keep documents that weren't removed (preserve by index)
        const existingDocs = existing.documents.filter((doc, index) => {
          return existingDocumentIndices.includes(index);
        });
        contractData.documents = [...existingDocs, ...newDocuments];
      } else {
        contractData.documents = newDocuments.length > 0 ? newDocuments : null;
      }
      await window.nrd.contracts.update(contractId, contractData);
    } else {
      contractData.documents = newDocuments.length > 0 ? newDocuments : null;
      await window.nrd.contracts.create(contractData);
    }
    
    hideSpinner();
    await showSuccess('Contrato/habilitación guardado exitosamente');
    
    // Reload information
    loadInformacion();
  } catch (error) {
    hideSpinner();
    await showError('Error al guardar contrato/habilitación: ' + error.message);
    console.error('Error saving contract:', error);
  }
}

// Delete contract handler
async function deleteContractHandler(contractId) {
  const confirmed = await showConfirm('Eliminar Contrato/Habilitación', '¿Está seguro de eliminar este contrato/habilitación?');
  if (!confirmed) return;
  
  showSpinner('Eliminando contrato/habilitación...');
  try {
    await window.nrd.contracts.delete(contractId);
    hideSpinner();
    await showSuccess('Contrato/habilitación eliminado exitosamente');
    loadInformacion();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar contrato/habilitación: ' + error.message);
    console.error('Error deleting contract:', error);
  }
}

// Add new contract button handlers
const addContractBtn = document.getElementById('add-contract-btn');
const addContractBtnEdit = document.getElementById('add-contract-btn-edit');

if (addContractBtn) {
  addContractBtn.addEventListener('click', async () => {
    try {
      const companyInfo = await nrd.companyInfo.get();
      await showEditMode(companyInfo);
      // After showing edit mode, add new contract
      setTimeout(() => {
        const contractsList = document.getElementById('contracts-list-edit');
        if (contractsList) {
          const newContractDiv = createContractEditItem('new', {});
          contractsList.appendChild(newContractDiv);
          newContractDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (error) {
      await showError('Error al cargar información: ' + error.message);
      console.error('Error loading company info:', error);
    }
  });
}

if (addContractBtnEdit) {
  addContractBtnEdit.addEventListener('click', () => {
    const contractsList = document.getElementById('contracts-list-edit');
    if (contractsList) {
      const newContractDiv = createContractEditItem('new', {});
      contractsList.appendChild(newContractDiv);
      newContractDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
