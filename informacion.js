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

// Generate PDF with all company information
async function generateCompanyPDF() {
  showSpinner('Generando PDF...');
  try {
    // Load all data
    const [companyInfoSnapshot, areasSnapshot, processesSnapshot, tasksSnapshot, rolesSnapshot, employeesSnapshot] = await Promise.all([
      getCompanyInfo(),
      getAreasRef().once('value'),
      getProcessesRef().once('value'),
      getTasksRef().once('value'),
      getRolesRef().once('value'),
      getEmployeesRef().once('value')
    ]);

    const companyInfo = companyInfoSnapshot.val() || {};
    const areas = areasSnapshot.val() || {};
    const processes = processesSnapshot.val() || {};
    const tasks = tasksSnapshot.val() || {};
    const roles = rolesSnapshot.val() || {};
    const employees = employeesSnapshot.val() || {};

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
        const roleName = employee.roleId && roles[employee.roleId] ? roles[employee.roleId].name : 'Sin rol';
        addText(employee.name || 'Sin nombre', 11, true);
        addText('Rol: ' + roleName, 9, false);
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
            const roleName = task.roleId && roles[task.roleId] ? roles[task.roleId].name : 'Sin rol';
            addText(`${index + 1}. ${task.name || 'Sin nombre'}`, 9, false);
            addText(`   Rol: ${roleName}`, 8, false);
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
        const roleName = task.roleId && roles[task.roleId] ? roles[task.roleId].name : 'Sin rol';
        
        addText(task.name || 'Sin nombre', 11, true);
        addText('Proceso: ' + processName, 9, false);
        addText('Rol: ' + roleName, 9, false);
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
        
        if (task.successCriteria) {
          addText('Criterios de éxito: ' + task.successCriteria, 9, false);
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
    await showSuccess('PDF generado exitosamente');
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
