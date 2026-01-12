// Area management

let areasListener = null;
let allAreas = {}; // Store all areas for filtering

// Normalize text for search (remove accents, ñ->n, b->v, c->s)
function normalizeSearchText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/ñ/g, 'n')
    .replace(/b/g, 'v')
    .replace(/c/g, 's');
}

// Filter and display areas
function filterAndDisplayAreas(searchTerm = '') {
  const areasList = document.getElementById('areas-list');
  if (!areasList) return;
  
  areasList.innerHTML = '';
  
  const term = normalizeSearchText(searchTerm.trim());
  const filteredAreas = Object.entries(allAreas).filter(([id, area]) => {
    if (!term) return true;
    const name = normalizeSearchText(area.name || '');
    const description = normalizeSearchText(area.description || '');
    return name.includes(term) || description.includes(term);
  });

  if (filteredAreas.length === 0) {
    areasList.innerHTML = '<p class="text-center text-gray-600 py-6 sm:py-8 text-sm sm:text-base">No se encontraron áreas</p>';
    return;
  }

  filteredAreas.forEach(([id, area]) => {
    const item = document.createElement('div');
    item.className = 'border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors cursor-pointer';
    item.dataset.areaId = id;
    item.innerHTML = `
      <div class="text-base sm:text-lg font-light mb-2 sm:mb-3">${escapeHtml(area.name)}</div>
      ${area.description ? `<div class="text-xs sm:text-sm text-gray-600">${escapeHtml(area.description)}</div>` : ''}
    `;
    item.addEventListener('click', () => viewArea(id));
    areasList.appendChild(item);
  });
}

// Load areas
function loadAreas() {
  const areasList = document.getElementById('areas-list');
  if (!areasList) return;
  
  areasList.innerHTML = '';

  // Remove previous listener
  if (areasListener) {
    areasListener();
    areasListener = null;
  }

  // Listen for areas using NRD Data Access
  areasListener = nrd.areas.onValue(async (data) => {
    if (!areasList) return;
    // If onValue returns array, convert to object with IDs as keys
    if (Array.isArray(data)) {
      const areasObj = {};
      data.forEach((area, index) => {
        const id = area.id || area.key || area.$id || index.toString();
        areasObj[id] = area;
      });
      allAreas = areasObj;
    } else {
      allAreas = data || {};
    }
    
    // Get search term and filter
    const searchInput = document.getElementById('areas-search');
    const searchTerm = searchInput ? searchInput.value : '';
    filterAndDisplayAreas(searchTerm);
  });
  
  // Add search input listener
  const searchInput = document.getElementById('areas-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterAndDisplayAreas(e.target.value);
    });
  }
}

// Show area form
function showAreaForm(areaId = null) {
  const form = document.getElementById('area-form');
  const list = document.getElementById('areas-list');
  const header = document.querySelector('#areas-view .flex.flex-col');
  const detail = document.getElementById('area-detail');
  const title = document.getElementById('area-form-title');
  const formElement = document.getElementById('area-form-element');
  const searchContainer = document.querySelector('#areas-search')?.parentElement;
  
  if (form) form.classList.remove('hidden');
  if (list) list.style.display = 'none';
  if (header) header.style.display = 'none';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'none';
  
  if (formElement) {
    formElement.reset();
    const areaIdInput = document.getElementById('area-id');
    if (areaIdInput) areaIdInput.value = areaId || '';
  }

  // Load employees for manager select
  loadEmployeesForSelect().then(employees => {
    const managerSelect = document.getElementById('area-manager-select');
    if (managerSelect) {
      managerSelect.innerHTML = '<option value="">Sin encargado</option>';
      employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        managerSelect.appendChild(option);
      });
      
      // Load area data if editing
      const subtitle = document.getElementById('area-form-subtitle');
      const saveBtn = document.getElementById('save-area-btn');
      
      if (areaId) {
        if (title) title.textContent = 'Editar Área';
        if (subtitle) subtitle.textContent = 'Modifique la información del área';
        // Cambiar color del header a azul para edición
        const formHeader = document.getElementById('area-form-header');
        if (formHeader) {
          formHeader.classList.remove('bg-green-600', 'bg-gray-600');
          formHeader.classList.add('bg-blue-600');
        }
        // Cambiar color del botón guardar a azul
        if (saveBtn) {
          saveBtn.classList.remove('bg-green-600', 'border-green-600', 'hover:bg-green-700');
          saveBtn.classList.add('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
        }
        nrd.areas.getById(areaId).then(area => {
          if (area) {
            const nameInput = document.getElementById('area-name');
            const descInput = document.getElementById('area-description');
            if (nameInput) nameInput.value = area.name || '';
            if (descInput) descInput.value = area.description || '';
            if (managerSelect) managerSelect.value = area.managerEmployeeId || '';
          }
        });
      } else {
        if (title) title.textContent = 'Nueva Área';
        if (subtitle) subtitle.textContent = 'Cree una nueva área operativa de la organización';
        // Cambiar color del header a verde para nuevo
        const formHeader = document.getElementById('area-form-header');
        if (formHeader) {
          formHeader.classList.remove('bg-blue-600', 'bg-gray-600');
          formHeader.classList.add('bg-green-600');
        }
        // Cambiar color del botón guardar a verde
        if (saveBtn) {
          saveBtn.classList.remove('bg-blue-600', 'border-blue-600', 'hover:bg-blue-700');
          saveBtn.classList.add('bg-green-600', 'border-green-600', 'hover:bg-green-700');
        }
      }
    }
  });
}

// Hide area form
function hideAreaForm() {
  const form = document.getElementById('area-form');
  const list = document.getElementById('areas-list');
  const header = document.querySelector('#areas-view .flex.flex-col');
  const detail = document.getElementById('area-detail');
  const searchContainer = document.querySelector('#areas-search')?.parentElement;
  
  if (form) form.classList.add('hidden');
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Save area
function saveArea(areaId, areaData) {
  if (areaId) {
    return nrd.areas.update(areaId, areaData);
  } else {
    return nrd.areas.create(areaData);
  }
}

// View area detail
async function viewArea(areaId) {
  if (!areaId) {
    await showError('ID de área no válido');
    return;
  }
  
  showSpinner('Cargando área...');
  try {
    let [area, allProcesses, allEmployees] = await Promise.all([
      nrd.areas.getById(areaId),
      nrd.processes.getAll(),
      nrd.employees.getAll()
    ]);
    
    // Convert arrays to objects with IDs as keys if needed
    const convertToObject = (data, name) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((item, index) => {
          const id = item.id || item.key || item.$id || index.toString();
          obj[id] = item;
        });
        return obj;
      }
      return data || {};
    };
    
    allProcesses = convertToObject(allProcesses, 'processes');
    allEmployees = convertToObject(allEmployees, 'employees');
    
    hideSpinner();
    if (!area) {
      await showError('Área no encontrada');
      return;
    }

    const list = document.getElementById('areas-list');
    const header = document.querySelector('#areas-view .flex.flex-col');
    const form = document.getElementById('area-form');
    const detail = document.getElementById('area-detail');
    const detailContent = document.getElementById('area-detail-content');
    
    const searchContainer = document.querySelector('#areas-search')?.parentElement;
    
    if (list) list.style.display = 'none';
    if (header) header.style.display = 'none';
    if (form) form.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchContainer) searchContainer.style.display = 'none';

    // Load processes for this area
    const areaProcesses = Object.entries(allProcesses || {})
      .filter(([id, process]) => process.areaId === areaId)
      .map(([id, process]) => ({ id, ...process }));

    // Get manager name
    let managerName = 'Sin encargado';
    if (area.managerEmployeeId && allEmployees[area.managerEmployeeId]) {
      managerName = allEmployees[area.managerEmployeeId].name;
    }

    detailContent.innerHTML = `
      <div class="space-y-3 sm:space-y-4">
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Nombre:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(area.name)}</span>
        </div>
        ${area.description ? `
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Descripción:</span>
          <span class="font-light text-sm sm:text-base text-right">${escapeHtml(area.description)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Empleado Encargado:</span>
          <span class="font-light text-sm sm:text-base">${escapeHtml(managerName)}</span>
        </div>
        <div class="flex justify-between py-2 sm:py-3 border-b border-gray-200">
          <span class="text-gray-600 font-light text-sm sm:text-base">Procesos:</span>
          <span class="font-light text-sm sm:text-base">${areaProcesses.length}</span>
        </div>
      </div>
      ${areaProcesses.length > 0 ? `
      <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h4 class="mb-3 sm:mb-4 text-xs uppercase tracking-wider text-gray-600">Procesos:</h4>
        <div class="space-y-2">
          ${areaProcesses.map(process => `
            <div class="border border-gray-200 p-2 sm:p-3 hover:border-red-600 transition-colors cursor-pointer" onclick="viewProcess('${process.id}')">
              <div class="font-light text-sm sm:text-base">${escapeHtml(process.name)}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;

    // Attach button handlers
    const editBtn = document.getElementById('edit-area-detail-btn');
    const deleteBtn = document.getElementById('delete-area-detail-btn');
    
    if (editBtn) {
      editBtn.onclick = () => {
        detail.classList.add('hidden');
        showAreaForm(areaId);
      };
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => deleteAreaHandler(areaId);
    }
  } catch (error) {
    hideSpinner();
    await showError('Error al cargar área: ' + error.message);
  }
}

// Back to areas list
function backToAreas() {
  const list = document.getElementById('areas-list');
  const header = document.querySelector('#areas-view .flex.flex-col');
  const detail = document.getElementById('area-detail');
  const form = document.getElementById('area-form');
  const searchContainer = document.querySelector('#areas-search')?.parentElement;
  
  if (list) list.style.display = 'block';
  if (header) header.style.display = 'flex';
  if (detail) detail.classList.add('hidden');
  if (form) form.classList.add('hidden');
  if (searchContainer) searchContainer.style.display = 'block';
}

// Delete area handler
async function deleteAreaHandler(areaId) {
  // Check if area has processes
  const processes = await nrd.processes.getAll();
  const hasProcesses = Object.values(processes || {}).some(p => p.areaId === areaId);
  
  if (hasProcesses) {
    await showError('No se puede eliminar un área que tiene procesos asociados');
    return;
  }

  const confirmed = await showConfirm('Eliminar Área', '¿Está seguro de eliminar esta área?');
  if (!confirmed) return;

  showSpinner('Eliminando área...');
  try {
    await nrd.areas.delete(areaId);
    hideSpinner();
    backToAreas();
  } catch (error) {
    hideSpinner();
    await showError('Error al eliminar área: ' + error.message);
  }
}

// Area form submit
const areaFormElement = document.getElementById('area-form-element');
if (areaFormElement) {
  areaFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const areaId = document.getElementById('area-id').value;
    const name = document.getElementById('area-name').value.trim();
    const description = document.getElementById('area-description').value.trim();
    const managerEmployeeId = document.getElementById('area-manager-select').value || null;

    if (!name) {
      await showError('Por favor complete el nombre del área');
      return;
    }

    showSpinner('Guardando área...');
    try {
      await saveArea(areaId || null, { 
        name, 
        description: description || null,
        managerEmployeeId: managerEmployeeId || null
      });
      hideSpinner();
      hideAreaForm();
      await showSuccess('Área guardada exitosamente');
    } catch (error) {
      hideSpinner();
      await showError('Error al guardar área: ' + error.message);
    }
  });
}

// New area button
const newAreaBtn = document.getElementById('new-area-btn');
if (newAreaBtn) {
  newAreaBtn.addEventListener('click', () => {
    showAreaForm();
  });
}

// Cancel area form
const cancelAreaBtn = document.getElementById('cancel-area-btn');
if (cancelAreaBtn) {
  cancelAreaBtn.addEventListener('click', () => {
    hideAreaForm();
  });
}

// Close area form button
const closeAreaFormBtn = document.getElementById('close-area-form');
if (closeAreaFormBtn) {
  closeAreaFormBtn.addEventListener('click', () => {
    hideAreaForm();
  });
}

// Back to areas button
const backToAreasBtn = document.getElementById('back-to-areas');
if (backToAreasBtn) {
  backToAreasBtn.addEventListener('click', () => {
    backToAreas();
  });
}

// Close area detail button
const closeAreaDetailBtn = document.getElementById('close-area-detail-btn');
if (closeAreaDetailBtn) {
  closeAreaDetailBtn.addEventListener('click', () => {
    backToAreas();
  });
}

// Load areas for process form
function loadAreasForProcess() {
  return nrd.areas.getAll().then(areas => {
    return Object.entries(areas || {}).map(([id, area]) => ({ id, ...area }));
  });
}

// Make functions available globally
window.viewArea = viewArea;
