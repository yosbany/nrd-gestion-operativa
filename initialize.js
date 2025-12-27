// System initialization logic

// Initial data structure from nrd-kb-generate
const initialData = {
  areas: [
    {
      name: 'Producción',
      description: 'Elaboración de productos propios del negocio hasta dejarlos listos para exhibición o venta'
    },
    {
      name: 'Ventas y Atención al Cliente',
      description: 'Atención directa al cliente, venta de productos, autoservicio asistido y caja'
    },
    {
      name: 'Administración y Gestión',
      description: 'Gestión operativa, administrativa y de soporte del negocio'
    }
  ],
  roles: [
    'Maestro Panadero',
    'Confitero / Repostero',
    'Cocinero / Rotisería',
    'Sándwichero',
    'Encargado de Turno / Cajero',
    'Encargada de Ventas',
    'Empleado de Mostrador / Vendedor',
    'Limpieza',
    'Encargado Contable',
    'Administrador'
  ],
  employees: [
    { name: 'Jorge', roleNames: ['Maestro Panadero'] },
    { name: 'Marcelo', roleNames: ['Confitero / Repostero', 'Cocinero / Rotisería'] },
    { name: 'Salvador', roleNames: ['Encargado Contable'] },
    { name: 'Marlenis', roleNames: ['Encargada de Ventas'] },
    { name: 'Marbelis', roleNames: ['Sándwichero'] },
    { name: 'Anisley', roleNames: ['Encargado de Turno / Cajero'] },
    { name: 'Yuneisis', roleNames: ['Confitero / Repostero', 'Cocinero / Rotisería'] },
    { name: 'Yamilka', roleNames: ['Limpieza'] },
    { name: 'Félix Manuel', roleNames: ['Empleado de Mostrador / Vendedor'] }
  ],
  tasks: [
    {
      name: 'Analizar o Conformar Plan de Producción',
      description: 'Revisar el Plan de Producción del día o período correspondiente para entender qué productos deben elaborarse, en qué cantidades y según qué especificaciones. Si el plan no existe o está incompleto, colaborar en su conformación con el área administrativa o supervisor.',
      roleNames: ['Encargado de Turno / Cajero', 'Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null, // Pendiente de definición
      estimatedTime: null, // Pendiente de definición
      cost: null, // Pendiente de definición
      type: 'with_role',
      executionSteps: [
        'Acceder al Plan de Producción (formato pendiente de definición: digital, físico, tablero)',
        'Revisar los productos asignados al proceso/proceso específico',
        'Identificar cantidades, presentaciones y especificaciones especiales de cada producto',
        'Verificar si hay instrucciones especiales, modificaciones o notas',
        'Si el plan está incompleto o ausente: consultar con supervisor o área administrativa, colaborar en la definición del plan usando información disponible (ventas previas, estacionalidad, stock disponible), documentar decisiones tomadas',
        'Confirmar comprensión del plan antes de continuar con la siguiente tarea'
      ],
      successCriteria: [
        'Se tiene claridad sobre todos los productos a producir',
        'Se conocen las cantidades exactas requeridas',
        'Se identificaron especificaciones especiales o modificaciones',
        'Si hubo conformación del plan, queda documentada',
        'No se inicia producción sin tener el plan definido'
      ],
      commonErrors: [
        'Iniciar producción sin revisar el plan completo',
        'Asumir cantidades o productos sin verificar',
        'No consultar cuando el plan está incompleto',
        'Ignorar especificaciones especiales o notas del plan',
        'Confundir productos de diferentes procesos'
      ]
    },
    {
      name: 'Revisar Insumos Necesarios para la Producción',
      description: 'Verificar disponibilidad y estado de los insumos, materias primas y materiales necesarios para la producción según el Plan de Producción.',
      roleNames: ['Encargado de Turno / Cajero', 'Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null, // Pendiente de definir
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Preparación de Subproductos (Mise en Place)',
      description: 'Preparar y disponer todos los subproductos, ingredientes y elementos necesarios para la producción, organizándolos de manera que faciliten el proceso de elaboración.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Producir Productos del Proceso',
      description: 'Ejecutar la elaboración de los productos indicados en el Plan de Producción, siguiendo las especificaciones, recetas y procedimientos técnicos correspondientes, asegurando calidad, presentación y cumplimiento de normas de seguridad alimentaria.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Verificar que la preparación de subproductos (mise en place) esté completa',
        'Revisar el Plan de Producción para confirmar productos y cantidades a producir',
        'Ejecutar la elaboración de cada producto según su procedimiento específico: seguir recetas o fichas técnicas (formato pendiente de definición), respetar tiempos, temperaturas y métodos de cocción cuando aplique, aplicar técnicas de armado, mezclado o conformado según corresponda, controlar calidad durante el proceso (aspecto, textura, sabor cuando sea posible)',
        'Realizar controles de calidad según protocolo establecido (pendiente de definición detallada)',
        'Disponer los productos terminados en condiciones adecuadas para la siguiente etapa (empaquetado o traslado según corresponda)',
        'Registrar productos producidos según método establecido (formato pendiente de definición: cantidad real, variaciones, incidencias)'
      ],
      successCriteria: [
        'Se produjeron todas las cantidades indicadas en el Plan de Producción (o se documentaron ajustes justificados)',
        'Los productos cumplen con especificaciones de calidad (aspecto, presentación, sabor cuando aplique)',
        'Se respetaron procedimientos técnicos y recetas establecidas',
        'Se cumplieron normas de seguridad alimentaria y buenas prácticas',
        'Los productos terminados están en condiciones adecuadas para la siguiente etapa',
        'Se registró la producción realizada'
      ],
      commonErrors: [
        'Producir cantidades diferentes a las del plan sin justificación ni comunicación',
        'No seguir recetas o procedimientos establecidos, improvisando',
        'Saltarse controles de calidad o no detectar productos fuera de especificación',
        'No respetar tiempos de cocción o temperaturas, afectando calidad o seguridad',
        'Contaminar productos por falta de higiene o malas prácticas',
        'No disponer productos terminados correctamente, afectando calidad o presentación',
        'No registrar producción, generando problemas de trazabilidad',
        'Producir productos sin tener subproductos completos, generando interrupciones'
      ]
    },
    {
      name: 'Empaquetar Productos Producidos',
      description: 'Empaquetar los productos producidos según especificaciones y estándares establecidos, asegurando presentación adecuada para la venta.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Trasladar Productos al Área de Ventas',
      description: 'Trasladar los productos producidos y empaquetados al área de ventas, disponiéndolos en vitrinas o áreas de exhibición según corresponda.',
      roleNames: ['Encargado de Turno / Cajero', 'Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Ordenar y Limpiar Área de Trabajo',
      description: 'Ordenar y limpiar el área de trabajo después de la producción, dejándola lista para el siguiente turno o proceso.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Revisar Vitrinas del Local de Venta',
      description: 'Revisar el estado de las vitrinas del local de venta, verificando disponibilidad de productos, presentación y condiciones adecuadas para la venta.',
      roleNames: ['Encargado de Turno / Cajero', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Limpieza de Área de Ventas',
      description: 'Realizar limpieza del área de ventas incluyendo cola, mostrador y área de atención al cliente.',
      roleNames: ['Encargado de Turno / Cajero', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Limpieza General de Áreas Comunes',
      description: 'Realizar limpieza y mantenimiento de áreas comunes del negocio como baños, pisos, pasillos y otros espacios compartidos, asegurando condiciones de higiene y orden para el funcionamiento del negocio.',
      roleNames: ['Limpieza'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Identificar áreas comunes a limpiar (baños, pisos, pasillos, áreas de circulación, otros espacios comunes - pendiente de definir lista completa)',
        'Revisar estado de las áreas para identificar necesidades específicas de limpieza',
        'Disponer herramientas y productos de limpieza necesarios según tipo de área',
        'Ejecutar limpieza de baños: limpiar sanitarios, lavabos, espejos, pisos, reabastecer insumos (papel higiénico, jabón, toallas - pendiente de definir protocolo detallado)',
        'Ejecutar limpieza de pisos: barrer, trapear, aspirar según corresponda (pendiente de definir método y productos según tipo de piso)',
        'Limpiar otras áreas comunes según corresponda (pasillos, áreas de circulación, espacios compartidos - pendiente de definir alcance)',
        'Recoger y disponer bolsas de basura de las áreas comunes',
        'Llevar las bolsas de basura al área designada (pendiente de definir ubicación específica)',
        'Verificar que las áreas queden limpias y ordenadas',
        'Guardar herramientas y productos de limpieza en sus ubicaciones designadas',
        'Documentar cualquier incidencia o necesidad de mantenimiento detectada (protocolo pendiente de definir)'
      ],
      successCriteria: [
        'Las áreas comunes están limpias y ordenadas',
        'Los baños están limpios y con insumos reabastecidos cuando corresponde',
        'Los pisos están limpios y secos',
        'Las bolsas de basura fueron recogidas y llevadas al área designada',
        'Se utilizaron productos y métodos de limpieza adecuados para cada tipo de área',
        'Las herramientas y productos de limpieza fueron guardados correctamente',
        'Se documentaron incidencias o necesidades de mantenimiento si corresponde'
      ],
      commonErrors: [
        'Limpiar solo algunas áreas, dejando otras sin limpiar',
        'No reabastecer insumos de baños (papel higiénico, jabón)',
        'Usar productos de limpieza inadecuados para el tipo de superficie',
        'Dejar pisos húmedos o mojados generando riesgos',
        'No recoger o llevar las bolsas de basura al área designada',
        'Dejar bolsas de basura en áreas comunes generando problemas de higiene',
        'No limpiar áreas de difícil acceso o menos visibles',
        'No documentar problemas de mantenimiento detectados',
        'No guardar herramientas y productos de limpieza después de usar',
        'Limpiar áreas de producción o ventas que no corresponden a limpieza general'
      ]
    },
    {
      name: 'Rallar Pan',
      description: 'Preparar pan rallado a partir de pan, rallándolo para obtener el producto necesario para uso en producción u otros fines del negocio.',
      roleNames: ['Encargado Contable'],
      frequency: 'Mensual',
      estimatedTime: null,
      cost: null, // Sin remuneración
      type: 'unpaid',
      executionSteps: [
        'Revisar disponibilidad de pan para rallar (pan sobrante o pan específico para este fin - pendiente de definir origen del pan)',
        'Disponer herramienta para rallar pan (rallador, procesador o método - pendiente de definir herramienta específica)',
        'Rallar el pan según método establecido (pendiente de definir método detallado)',
        'Verificar que el pan rallado tenga la consistencia adecuada (pendiente de definir especificaciones de consistencia)',
        'Almacenar pan rallado en contenedor adecuado según método establecido (pendiente de definir método de almacenamiento)',
        'Etiquetar o identificar pan rallado si corresponde (pendiente de definir método de identificación)',
        'Guardar pan rallado en ubicación designada (pendiente de definir ubicación de almacenamiento)',
        'Limpiar herramienta utilizada después de rallar'
      ],
      successCriteria: [
        'El pan fue rallado completamente según cantidad requerida',
        'El pan rallado tiene consistencia adecuada (no muy grueso, no muy fino - pendiente de definir especificación)',
        'El pan rallado fue almacenado correctamente',
        'El pan rallado está identificado o etiquetado si corresponde',
        'La herramienta utilizada fue limpiada después de usar',
        'El pan rallado está disponible para uso en producción'
      ],
      commonErrors: [
        'Rallar pan sin verificar que esté en condiciones adecuadas para rallar',
        'No rallar completamente el pan disponible',
        'Rallar pan con consistencia incorrecta (muy grueso o muy fino)',
        'No almacenar pan rallado correctamente, afectando conservación',
        'No limpiar herramienta después de usar',
        'No identificar pan rallado, generando confusión sobre fecha o origen',
        'Dejar pan rallado sin guardar en ubicación designada'
      ]
    },
    {
      name: 'Apertura de Caja',
      description: 'Preparar el sistema de punto de venta y caja para iniciar operaciones del día, verificando que todos los elementos necesarios estén disponibles, funcionando correctamente y listos para la atención al cliente.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas'],
      frequency: 'Diaria',
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Verificar que el sistema de punto de venta esté funcionando correctamente',
        'Verificar disponibilidad de efectivo inicial (pendiente de definir cantidad y método)',
        'Verificar disponibilidad de materiales necesarios (papel para tickets, bolsas, elementos de empaque - pendiente de definir lista completa)',
        'Verificar funcionamiento de equipos de pago (terminal de tarjetas, lector de códigos - pendiente de definir equipos específicos)',
        'Revisar que el área de caja esté limpia y ordenada',
        'Configurar o verificar configuración inicial del sistema según corresponda (pendiente de definir especificaciones)',
        'Realizar prueba de funcionamiento del sistema si corresponde (pendiente de definir protocolo)',
        'Confirmar que todo esté listo para iniciar operaciones'
      ],
      successCriteria: [
        'El sistema de punto de venta está funcionando correctamente',
        'Hay efectivo inicial disponible en cantidad adecuada',
        'Todos los materiales necesarios están disponibles',
        'Los equipos de pago están funcionando',
        'El área de caja está limpia y ordenada',
        'El sistema está configurado correctamente',
        'Se confirmó que todo está listo para iniciar operaciones'
      ],
      commonErrors: [
        'Iniciar operaciones sin verificar que el sistema funciona correctamente',
        'No verificar disponibilidad de efectivo inicial, generando problemas durante el día',
        'No verificar funcionamiento de equipos de pago, generando inconvenientes con clientes',
        'No disponer de materiales necesarios (papel, bolsas), interrumpiendo operaciones',
        'Saltarse pasos de verificación asumiendo que todo está bien',
        'No probar el sistema antes de iniciar, detectando problemas cuando ya hay clientes'
      ]
    },
    {
      name: 'Cierre de Caja',
      description: 'Cerrar el sistema de punto de venta y caja al finalizar operaciones del día, realizando conciliación y cierre correspondiente.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Atención al Cliente y Venta',
      description: 'Atender a los clientes, procesar ventas y proporcionar servicio al cliente.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Atención de Pedidos por Plataformas en Línea',
      description: 'Atender pedidos recibidos a través de plataformas en línea, procesar las ventas y coordinar la preparación y entrega de productos.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Compra de Insumos y Productos',
      description: 'Adquirir insumos, materias primas, materiales para producción y productos para reventa.',
      roleNames: ['Administrador'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Contabilidad',
      description: 'Llevar la contabilidad del negocio, registrando operaciones financieras y cumpliendo obligaciones fiscales.',
      roleNames: ['Encargado Contable'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Mantenimiento Básico de Equipos e Instalaciones',
      description: 'Realizar mantenimiento básico de equipos, instalaciones y sistemas.',
      roleNames: [], // Pendiente de definir
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'without_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    },
    {
      name: 'Planificación de Producción',
      description: 'Definir qué productos producir, en qué cantidades y según qué especificaciones.',
      roleNames: ['Administrador'],
      frequency: null,
      estimatedTime: null,
      cost: null,
      type: 'with_role',
      executionSteps: null,
      successCriteria: null,
      commonErrors: null
    }
  ],
  processes: [
    {
      name: 'Producción de Panadería',
      areaName: 'Producción',
      objective: 'Elaborar productos de panadería (panes, facturas, bizcochos, etc.) según el Plan de Producción, cumpliendo con estándares de calidad, textura, sabor y presentación.',
      taskNames: [
        'Analizar o Conformar Plan de Producción',
        'Revisar Insumos Necesarios para la Producción',
        'Preparación de Subproductos (Mise en Place)',
        'Producir Productos del Proceso',
        'Ordenar y Limpiar Área de Trabajo'
      ],
      employeeNames: ['Jorge']
    },
    {
      name: 'Producción de Sándwiches y Productos Afines',
      areaName: 'Producción',
      objective: 'Elaborar sándwiches y productos afines según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      taskNames: [
        'Analizar o Conformar Plan de Producción',
        'Revisar Insumos Necesarios para la Producción',
        'Preparación de Subproductos (Mise en Place)',
        'Producir Productos del Proceso',
        'Empaquetar Productos Producidos',
        'Trasladar Productos al Área de Ventas',
        'Ordenar y Limpiar Área de Trabajo'
      ],
      employeeNames: ['Marbelis']
    },
    {
      name: 'Producción de Rotisería Tradicional',
      areaName: 'Producción',
      objective: 'Elaborar productos de rotisería tradicional según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      taskNames: [
        'Analizar o Conformar Plan de Producción',
        'Revisar Insumos Necesarios para la Producción',
        'Preparación de Subproductos (Mise en Place)',
        'Producir Productos del Proceso',
        'Empaquetar Productos Producidos',
        'Trasladar Productos al Área de Ventas',
        'Ordenar y Limpiar Área de Trabajo'
      ],
      employeeNames: ['Marcelo', 'Yuneisis']
    },
    {
      name: 'Producción de Menús y Platos Variables',
      areaName: 'Producción',
      objective: 'Elaborar menús y platos variables según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      taskNames: [
        'Analizar o Conformar Plan de Producción',
        'Revisar Insumos Necesarios para la Producción',
        'Preparación de Subproductos (Mise en Place)',
        'Producir Productos del Proceso',
        'Empaquetar Productos Producidos',
        'Trasladar Productos al Área de Ventas',
        'Ordenar y Limpiar Área de Trabajo'
      ],
      employeeNames: ['Marcelo', 'Yuneisis']
    },
    {
      name: 'Apertura de Caja',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Preparar el sistema de punto de venta y caja para iniciar operaciones, verificando que todos los elementos necesarios estén disponibles y funcionando correctamente.',
      taskNames: ['Apertura de Caja'],
      employeeNames: ['Marlenis', 'Anisley']
    },
    {
      name: 'Atención a Clientes por Plataformas en Línea y Venta',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Atender pedidos recibidos a través de plataformas en línea, procesar las ventas, coordinar la preparación y entrega de productos.',
      taskNames: [], // Pendiente de definir
      employeeNames: [] // Pendiente de definir
    },
    {
      name: 'Reposición de Vitrinas',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Reponer productos en las vitrinas del local de venta, asegurando disponibilidad y presentación adecuada.',
      taskNames: ['Revisar Vitrinas del Local de Venta', 'Limpieza de Área de Ventas'],
      employeeNames: ['Marlenis', 'Anisley', 'Félix Manuel']
    },
    {
      name: 'Atención al Cliente y Venta',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Atender a los clientes y procesar ventas.',
      taskNames: ['Atención al Cliente y Venta', 'Limpieza de Área de Ventas'],
      employeeNames: ['Marlenis', 'Anisley', 'Félix Manuel']
    },
    {
      name: 'Cierre de Caja',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Cerrar el sistema de punto de venta y caja al finalizar operaciones.',
      taskNames: ['Cierre de Caja'],
      employeeNames: ['Marlenis', 'Anisley']
    },
    {
      name: 'Compra',
      areaName: 'Administración y Gestión',
      objective: 'Adquirir insumos, materias primas, materiales para producción y productos para reventa.',
      taskNames: [], // Pendiente de definir
      employeeNames: [] // Pendiente de definir
    },
    {
      name: 'Contabilidad',
      areaName: 'Administración y Gestión',
      objective: 'Llevar la contabilidad del negocio, registrando operaciones financieras y cumpliendo obligaciones fiscales.',
      taskNames: [], // Pendiente de definir
      employeeNames: ['Salvador']
    },
    {
      name: 'Limpieza General',
      areaName: 'Administración y Gestión',
      objective: 'Mantener limpias y en condiciones adecuadas las áreas comunes del negocio (baños, pisos, pasillos y otros espacios compartidos), asegurando condiciones de higiene y orden para el funcionamiento general del negocio.',
      taskNames: ['Limpieza General de Áreas Comunes'],
      employeeNames: ['Yamilka']
    },
    {
      name: 'Mantenimiento Básico',
      areaName: 'Administración y Gestión',
      objective: 'Realizar mantenimiento básico de equipos, instalaciones y sistemas.',
      taskNames: [], // Pendiente de definir
      employeeNames: [] // Pendiente de definir
    },
    {
      name: 'Preparación de Insumos y Tareas Periódicas',
      areaName: 'Administración y Gestión',
      objective: 'Tareas periódicas de preparación que no forman parte de procesos diarios.',
      taskNames: ['Rallar Pan'],
      employeeNames: ['Salvador']
    },
    {
      name: 'Planificación de Producción',
      areaName: 'Administración y Gestión',
      objective: 'Definir qué productos producir, en qué cantidades y según qué especificaciones.',
      taskNames: [], // Pendiente de definir
      employeeNames: [] // Pendiente de definir
    }
  ]
};

// Initialize system structure
async function initializeSystem() {
  try {
    showSpinner('Inicializando sistema...');
    
    // Step 1: Initialize company info structure
    const companyInfoRef = getCompanyInfoRef();
    const companyInfoSnapshot = await companyInfoRef.once('value');
    const existingCompanyInfo = companyInfoSnapshot.val();
    
    if (!existingCompanyInfo) {
      await companyInfoRef.set({
        legalName: null,
        tradeName: null,
        rut: null,
        address: null,
        phone: null,
        mobile: null,
        email: null,
        mission: null,
        vision: null
      });
    }
    
    // Step 2: Create areas
    const areasRef = getAreasRef();
    const areasSnapshot = await areasRef.once('value');
    const existingAreas = areasSnapshot.val() || {};
    const areaNameToId = {};
    
    for (const areaData of initialData.areas) {
      // Check if area already exists by name
      const existingArea = Object.entries(existingAreas).find(([id, area]) => area.name === areaData.name);
      
      if (existingArea) {
        areaNameToId[areaData.name] = existingArea[0];
      } else {
        const newAreaRef = await createArea({
          name: areaData.name,
          description: areaData.description,
          managerEmployeeId: null
        });
        areaNameToId[areaData.name] = newAreaRef.key;
      }
    }
    
    // Step 3: Create roles
    const rolesRef = getRolesRef();
    const rolesSnapshot = await rolesRef.once('value');
    const existingRoles = rolesSnapshot.val() || {};
    const roleNameToId = {};
    
    for (const roleName of initialData.roles) {
      // Check if role already exists by name
      const existingRole = Object.entries(existingRoles).find(([id, role]) => role.name === roleName);
      
      if (existingRole) {
        roleNameToId[roleName] = existingRole[0];
      } else {
        const newRoleRef = await createRole({
          name: roleName,
          description: null
        });
        roleNameToId[roleName] = newRoleRef.key;
      }
    }
    
    // Step 4: Create employees
    const employeesRef = getEmployeesRef();
    const employeesSnapshot = await employeesRef.once('value');
    const existingEmployees = employeesSnapshot.val() || {};
    const employeeNameToId = {};
    
    for (const employeeData of initialData.employees) {
      // Check if employee already exists by name
      const existingEmployee = Object.entries(existingEmployees).find(([id, emp]) => emp.name === employeeData.name);
      
      if (existingEmployee) {
        employeeNameToId[employeeData.name] = existingEmployee[0];
        // Update roleIds if needed
        const roleIds = employeeData.roleNames.map(rn => roleNameToId[rn]).filter(Boolean);
        if (roleIds.length > 0) {
          await updateEmployee(existingEmployee[0], { roleIds });
        }
      } else {
        const roleIds = employeeData.roleNames.map(rn => roleNameToId[rn]).filter(Boolean);
        const newEmployeeRef = await createEmployee({
          name: employeeData.name,
          roleIds: roleIds.length > 0 ? roleIds : null,
          email: null,
          phone: null
        });
        employeeNameToId[employeeData.name] = newEmployeeRef.key;
      }
    }
    
    // Step 5: Create tasks
    const tasksRef = getTasksRef();
    const tasksSnapshot = await tasksRef.once('value');
    const existingTasks = tasksSnapshot.val() || {};
    const taskNameToId = {};
    
    for (const taskData of initialData.tasks) {
      // Check if task already exists by name
      const existingTask = Object.entries(existingTasks).find(([id, task]) => task.name === taskData.name);
      
      if (existingTask) {
        taskNameToId[taskData.name] = existingTask[0];
      } else {
        const roleIds = taskData.roleNames ? taskData.roleNames.map(rn => roleNameToId[rn]).filter(Boolean) : null;
        
        const taskToCreate = {
          name: taskData.name,
          description: taskData.description || null,
          type: taskData.type,
          frequency: taskData.frequency || null,
          estimatedTime: taskData.estimatedTime || null,
          cost: taskData.cost || null,
          executionSteps: taskData.executionSteps || null,
          successCriteria: taskData.successCriteria || null,
          commonErrors: taskData.commonErrors || null,
          roleIds: (taskData.type === 'with_role' && roleIds && roleIds.length > 0) ? roleIds : null
        };
        
        const newTaskRef = await createTask(taskToCreate);
        taskNameToId[taskData.name] = newTaskRef.key;
      }
    }
    
    // Step 6: Create processes
    const processesRef = getProcessesRef();
    const processesSnapshot = await processesRef.once('value');
    const existingProcesses = processesSnapshot.val() || {};
    
    for (const processData of initialData.processes) {
      // Check if process already exists by name
      const existingProcess = Object.entries(existingProcesses).find(([id, proc]) => proc.name === processData.name);
      
      if (!existingProcess) {
        const areaId = areaNameToId[processData.areaName];
        if (!areaId) {
          console.warn(`Area "${processData.areaName}" not found for process "${processData.name}"`);
          continue;
        }
        
        // Get task IDs in order
        const taskIds = processData.taskNames
          .map(tn => taskNameToId[tn])
          .filter(Boolean);
        
        const processToCreate = {
          name: processData.name,
          areaId: areaId,
          objective: processData.objective || null,
          taskIds: taskIds.length > 0 ? taskIds : null
        };
        
        await createProcess(processToCreate);
      }
    }
    
    // Step 7: Initialize contracts structure (empty if doesn't exist)
    const contractsRef = getContractsRef();
    const contractsSnapshot = await contractsRef.once('value');
    if (!contractsSnapshot.val()) {
      // Contracts will be created by user, no default structure needed
    }
    
    hideSpinner();
    await showSuccess('Sistema inicializado exitosamente con datos de nrd-kb-generate');
    
    // Reload the app to show initialized structure
    location.reload();
  } catch (error) {
    hideSpinner();
    await showError('Error al inicializar: ' + error.message);
    console.error('Initialize error:', error);
    throw error;
  }
}

// Initialize button handler
const initializeBtn = document.getElementById('initialize-btn');
if (initializeBtn) {
  initializeBtn.addEventListener('click', async () => {
    try {
      const currentUser = getCurrentUser();
      
      // Verify user is authorized
      if (!currentUser || currentUser.email !== 'yosbany@nrd.com') {
        await showError('No tienes permisos para inicializar');
        return;
      }
      
      const confirmed = await showConfirm(
        'Inicializar Sistema', 
        '¿Está seguro de que desea inicializar el sistema? Esta acción cargará todos los datos de la carpeta nrd-kb-generate (áreas, procesos, tareas, roles y empleados). Los datos existentes se mantendrán si ya existen.'
      );
      
      if (!confirmed) return;
      
      await initializeSystem();
    } catch (error) {
      console.error('Initialize button error:', error);
    }
  });
}
