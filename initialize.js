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
    { name: 'Félix Manuel', roleNames: ['Empleado de Mostrador / Vendedor'] },
    { name: 'Yosbany', roleNames: ['Administrador'] },
    { name: 'Manuel', roleNames: ['Administrador'] }
  ],
  tasks: [
    {
      name: 'Analizar o Conformar Plan de Producción',
      description: 'Revisar el Plan de Producción del día o período correspondiente para entender qué productos deben elaborarse, en qué cantidades y según qué especificaciones. Si el plan no existe o está incompleto, colaborar en su conformación con el área administrativa o supervisor.',
      roleNames: ['Encargado de Turno / Cajero', 'Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null, // Pendiente de definición
      estimatedTime: 15, // Minutos
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
      estimatedTime: 20,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Revisar el Plan de Producción para identificar insumos necesarios',
        'Verificar disponibilidad de insumos en almacén o área de almacenamiento',
        'Revisar estado y calidad de los insumos disponibles',
        'Identificar insumos faltantes o insuficientes',
        'Comunicar necesidades de insumos si corresponde',
        'Confirmar que los insumos necesarios están disponibles antes de iniciar producción'
      ],
      successCriteria: [
        'Se identificaron todos los insumos necesarios según el Plan de Producción',
        'Se verificó disponibilidad y estado de los insumos',
        'Los insumos necesarios están disponibles o se comunicó la necesidad',
        'No se inicia producción sin insumos necesarios'
      ],
      commonErrors: [
        'No revisar el Plan de Producción antes de verificar insumos',
        'Asumir que los insumos están disponibles sin verificar',
        'No identificar insumos faltantes antes de iniciar producción',
        'No comunicar necesidades de insumos cuando faltan',
        'Iniciar producción sin insumos necesarios'
      ]
    },
    {
      name: 'Preparación de Subproductos (Mise en Place)',
      description: 'Preparar y disponer todos los subproductos, ingredientes y elementos necesarios para la producción, organizándolos de manera que faciliten el proceso de elaboración.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: 30,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Identificar subproductos e ingredientes necesarios según el Plan de Producción',
        'Preparar y procesar ingredientes según corresponda (cortar, mezclar, pre-cocinar, etc.)',
        'Organizar ingredientes y subproductos en el área de trabajo',
        'Disponer herramientas y utensilios necesarios',
        'Verificar que todos los elementos estén listos antes de iniciar producción',
        'Mantener organización y limpieza durante la preparación'
      ],
      successCriteria: [
        'Todos los subproductos e ingredientes necesarios están preparados',
        'Los elementos están organizados y accesibles en el área de trabajo',
        'Las herramientas y utensilios están disponibles',
        'La preparación está completa antes de iniciar producción',
        'El área de trabajo está organizada y limpia'
      ],
      commonErrors: [
        'No preparar todos los subproductos necesarios antes de iniciar',
        'No organizar ingredientes, generando interrupciones durante la producción',
        'No disponer herramientas necesarias, retrasando el proceso',
        'Iniciar producción sin tener la preparación completa',
        'No mantener organización durante la preparación'
      ]
    },
    {
      name: 'Producir Productos del Proceso',
      description: 'Ejecutar la elaboración de los productos indicados en el Plan de Producción, siguiendo las especificaciones, recetas y procedimientos técnicos correspondientes, asegurando calidad, presentación y cumplimiento de normas de seguridad alimentaria.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: 120,
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
      estimatedTime: 30,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Verificar que los productos estén listos para empaquetar',
        'Seleccionar empaque adecuado según tipo de producto',
        'Empaquetar productos según especificaciones y estándares',
        'Verificar presentación y etiquetado si corresponde',
        'Disponer productos empaquetados para traslado o exhibición',
        'Registrar productos empaquetados si corresponde'
      ],
      successCriteria: [
        'Todos los productos fueron empaquetados correctamente',
        'El empaque cumple con especificaciones y estándares',
        'La presentación es adecuada para la venta',
        'Los productos están listos para traslado o exhibición',
        'Se registró la información si corresponde'
      ],
      commonErrors: [
        'Empaquetar productos que no están completamente listos',
        'Usar empaque inadecuado para el tipo de producto',
        'No seguir especificaciones de empaque establecidas',
        'Empaquetar con presentación deficiente',
        'No verificar etiquetado o información del producto',
        'No disponer productos empaquetados correctamente'
      ]
    },
    {
      name: 'Trasladar Productos al Área de Ventas',
      description: 'Trasladar los productos producidos y empaquetados al área de ventas, disponiéndolos en vitrinas o áreas de exhibición según corresponda.',
      roleNames: ['Encargado de Turno / Cajero', 'Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: 15,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Verificar que los productos estén listos para traslado',
        'Preparar productos para traslado de manera segura',
        'Trasladar productos al área de ventas',
        'Disponer productos en vitrinas o áreas de exhibición según corresponda',
        'Verificar presentación y organización en el área de ventas',
        'Comunicar disponibilidad de productos si corresponde'
      ],
      successCriteria: [
        'Los productos fueron trasladados correctamente',
        'Los productos están disponibles en el área de ventas',
        'La presentación en vitrinas o exhibición es adecuada',
        'Los productos están organizados y accesibles',
        'Se comunicó la disponibilidad si corresponde'
      ],
      commonErrors: [
        'Trasladar productos sin verificar que estén listos',
        'No proteger productos durante el traslado, afectando calidad',
        'No disponer productos correctamente en vitrinas',
        'No organizar productos en el área de ventas',
        'No comunicar disponibilidad de nuevos productos'
      ]
    },
    {
      name: 'Ordenar y Limpiar Área de Trabajo',
      description: 'Ordenar y limpiar el área de trabajo después de la producción, dejándola lista para el siguiente turno o proceso.',
      roleNames: ['Maestro Panadero', 'Confitero / Repostero', 'Cocinero / Rotisería', 'Sándwichero'],
      frequency: null,
      estimatedTime: 20,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Recoger y organizar herramientas y utensilios utilizados',
        'Limpiar superficies de trabajo',
        'Limpiar equipos utilizados según corresponda',
        'Disponer residuos y desechos correctamente',
        'Organizar insumos y materiales restantes',
        'Verificar que el área quede ordenada y limpia',
        'Guardar herramientas y materiales en sus ubicaciones designadas'
      ],
      successCriteria: [
        'El área de trabajo está ordenada y limpia',
        'Las herramientas y utensilios están guardados correctamente',
        'Los equipos están limpios y en condiciones adecuadas',
        'Los residuos fueron dispuestos correctamente',
        'El área está lista para el siguiente turno o proceso'
      ],
      commonErrors: [
        'No limpiar el área de trabajo después de usar',
        'Dejar herramientas y utensilios sin organizar',
        'No limpiar equipos, afectando su funcionamiento',
        'No disponer residuos correctamente',
        'Dejar el área desordenada para el siguiente turno',
        'No guardar herramientas en sus ubicaciones designadas'
      ]
    },
    {
      name: 'Revisar Vitrinas del Local de Venta',
      description: 'Revisar el estado de las vitrinas del local de venta, verificando disponibilidad de productos, presentación y condiciones adecuadas para la venta.',
      roleNames: ['Encargado de Turno / Cajero', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: 10,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Revisar disponibilidad de productos en vitrinas',
        'Verificar presentación y organización de productos',
        'Identificar productos faltantes o con baja disponibilidad',
        'Verificar condiciones de conservación y temperatura si corresponde',
        'Identificar necesidades de reposición',
        'Comunicar necesidades de reposición si corresponde',
        'Registrar observaciones si corresponde'
      ],
      successCriteria: [
        'Se revisó el estado de todas las vitrinas',
        'Se identificó disponibilidad de productos',
        'Se verificó presentación y organización',
        'Se identificaron necesidades de reposición',
        'Se comunicaron necesidades si corresponde'
      ],
      commonErrors: [
        'No revisar todas las vitrinas sistemáticamente',
        'No identificar productos faltantes o con baja disponibilidad',
        'No verificar condiciones de conservación',
        'No comunicar necesidades de reposición',
        'No mantener presentación adecuada de productos'
      ]
    },
    {
      name: 'Limpieza de Área de Ventas',
      description: 'Realizar limpieza del área de ventas incluyendo cola, mostrador y área de atención al cliente.',
      roleNames: ['Encargado de Turno / Cajero', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: 15,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Identificar áreas a limpiar (cola, mostrador, área de atención)',
        'Disponer herramientas y productos de limpieza necesarios',
        'Limpiar mostrador y superficies de trabajo',
        'Limpiar área de cola y espera',
        'Limpiar área de atención al cliente',
        'Organizar y ordenar elementos del área',
        'Verificar que el área quede limpia y ordenada',
        'Guardar herramientas de limpieza'
      ],
      successCriteria: [
        'El área de ventas está limpia y ordenada',
        'El mostrador está limpio y organizado',
        'El área de cola y atención está limpia',
        'Los elementos están organizados correctamente',
        'El área está lista para atención al cliente'
      ],
      commonErrors: [
        'No limpiar todas las áreas sistemáticamente',
        'Dejar el mostrador desordenado o sucio',
        'No limpiar área de cola o espera',
        'No organizar elementos del área',
        'Dejar herramientas de limpieza sin guardar'
      ]
    },
    {
      name: 'Limpieza General de Áreas Comunes',
      description: 'Realizar limpieza y mantenimiento de áreas comunes del negocio como baños, pisos, pasillos y otros espacios compartidos, asegurando condiciones de higiene y orden para el funcionamiento del negocio.',
      roleNames: ['Limpieza'],
      frequency: null,
      estimatedTime: 60,
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
      estimatedTime: 45,
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
      estimatedTime: 20,
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
      frequency: 'Diaria',
      estimatedTime: 30,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Verificar que no haya clientes pendientes de atender',
        'Realizar corte de caja en el sistema de punto de venta',
        'Contar efectivo disponible en caja',
        'Conciliar efectivo con ventas registradas',
        'Verificar pagos con tarjeta y otros métodos',
        'Registrar diferencias si las hay',
        'Preparar efectivo para depósito o entrega',
        'Cerrar sistema de punto de venta',
        'Documentar cierre de caja según protocolo establecido'
      ],
      successCriteria: [
        'Se realizó el corte de caja correctamente',
        'Se contó y concilió el efectivo',
        'Se verificaron todos los métodos de pago',
        'Se registraron diferencias si las hubo',
        'El sistema fue cerrado correctamente',
        'Se documentó el cierre según protocolo'
      ],
      commonErrors: [
        'Cerrar caja con clientes pendientes de atender',
        'No contar efectivo correctamente',
        'No conciliar efectivo con ventas registradas',
        'No verificar todos los métodos de pago',
        'No registrar diferencias cuando las hay',
        'No documentar el cierre correctamente',
        'Cerrar sistema sin completar todas las verificaciones'
      ]
    },
    {
      name: 'Atención al Cliente y Venta',
      description: 'Atender a los clientes, procesar ventas y proporcionar servicio al cliente.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: 5,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Recibir y saludar al cliente',
        'Identificar necesidades del cliente',
        'Mostrar y ofrecer productos disponibles',
        'Proporcionar información sobre productos si corresponde',
        'Procesar la venta en el sistema de punto de venta',
        'Cobrar y procesar el pago',
        'Empaquetar productos vendidos',
        'Entregar productos y despedir al cliente',
        'Registrar la venta si corresponde'
      ],
      successCriteria: [
        'El cliente fue atendido de manera cordial y profesional',
        'Se identificaron y satisfacieron las necesidades del cliente',
        'La venta fue procesada correctamente',
        'El pago fue procesado sin errores',
        'Los productos fueron entregados correctamente',
        'La venta fue registrada si corresponde'
      ],
      commonErrors: [
        'No atender al cliente de manera cordial',
        'No identificar necesidades del cliente',
        'Procesar venta incorrectamente en el sistema',
        'Cometer errores en el cobro o cambio',
        'No empaquetar productos correctamente',
        'No entregar productos al cliente',
        'No registrar la venta cuando corresponde'
      ]
    },
    {
      name: 'Atención de Pedidos por Plataformas en Línea',
      description: 'Atender pedidos recibidos a través de plataformas en línea, procesar las ventas y coordinar la preparación y entrega de productos.',
      roleNames: ['Encargado de Turno / Cajero', 'Encargada de Ventas', 'Empleado de Mostrador / Vendedor'],
      frequency: null,
      estimatedTime: 10,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Revisar pedidos recibidos en plataformas en línea',
        'Verificar disponibilidad de productos solicitados',
        'Confirmar pedido con el cliente si corresponde',
        'Procesar el pedido en el sistema',
        'Coordinar preparación de productos si corresponde',
        'Verificar que los productos estén listos',
        'Preparar pedido para entrega o retiro',
        'Procesar pago según método establecido',
        'Registrar la venta y entrega del pedido'
      ],
      successCriteria: [
        'Se revisaron todos los pedidos recibidos',
        'Se verificó disponibilidad de productos',
        'El pedido fue procesado correctamente',
        'Se coordinó la preparación si corresponde',
        'El pedido fue entregado o está listo para retiro',
        'El pago fue procesado correctamente',
        'La venta fue registrada'
      ],
      commonErrors: [
        'No revisar pedidos de manera oportuna',
        'No verificar disponibilidad antes de confirmar',
        'Procesar pedido sin productos disponibles',
        'No coordinar preparación de productos',
        'No verificar que productos estén listos',
        'No procesar pago correctamente',
        'No registrar la venta del pedido'
      ]
    },
    {
      name: 'Compra de Insumos y Productos',
      description: 'Adquirir insumos, materias primas, materiales para producción y productos para reventa.',
      roleNames: ['Administrador'],
      frequency: null,
      estimatedTime: 60,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Identificar necesidades de compra según planificación',
        'Revisar proveedores y opciones disponibles',
        'Solicitar cotizaciones si corresponde',
        'Evaluar opciones y seleccionar proveedor',
        'Realizar pedido o compra',
        'Verificar recepción de productos',
        'Verificar calidad y cantidad de productos recibidos',
        'Registrar compra en sistema si corresponde',
        'Almacenar productos según corresponda'
      ],
      successCriteria: [
        'Se identificaron todas las necesidades de compra',
        'Se evaluaron opciones y se seleccionó proveedor adecuado',
        'La compra fue realizada correctamente',
        'Los productos fueron recibidos y verificados',
        'La compra fue registrada si corresponde',
        'Los productos fueron almacenados correctamente'
      ],
      commonErrors: [
        'No identificar todas las necesidades de compra',
        'No evaluar opciones de proveedores',
        'Comprar sin verificar disponibilidad de presupuesto',
        'No verificar calidad de productos recibidos',
        'No registrar la compra',
        'No almacenar productos correctamente'
      ]
    },
    {
      name: 'Contabilidad',
      description: 'Llevar la contabilidad del negocio, registrando operaciones financieras y cumpliendo obligaciones fiscales.',
      roleNames: ['Encargado Contable'],
      frequency: null,
      estimatedTime: 120,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Recopilar documentos contables (facturas, recibos, comprobantes)',
        'Registrar operaciones financieras en sistema contable',
        'Clasificar operaciones según corresponda',
        'Realizar conciliaciones bancarias',
        'Preparar reportes contables periódicos',
        'Cumplir con obligaciones fiscales y tributarias',
        'Archivar documentos contables',
        'Mantener registros actualizados'
      ],
      successCriteria: [
        'Todas las operaciones fueron registradas',
        'Los registros están actualizados y organizados',
        'Se realizaron conciliaciones correctamente',
        'Se cumplieron obligaciones fiscales',
        'Los documentos están archivados correctamente',
        'Los reportes son precisos y oportunos'
      ],
      commonErrors: [
        'No registrar operaciones de manera oportuna',
        'Registrar operaciones incorrectamente',
        'No realizar conciliaciones bancarias',
        'No cumplir con obligaciones fiscales',
        'No archivar documentos correctamente',
        'Mantener registros desactualizados'
      ]
    },
    {
      name: 'Mantenimiento Básico de Equipos e Instalaciones',
      description: 'Realizar mantenimiento básico de equipos, instalaciones y sistemas.',
      roleNames: [], // Pendiente de definir
      frequency: null,
      estimatedTime: 45,
      cost: null,
      type: 'without_role',
      executionSteps: [
        'Identificar equipos e instalaciones que requieren mantenimiento',
        'Revisar estado y funcionamiento de equipos',
        'Realizar limpieza y mantenimiento básico',
        'Verificar funcionamiento después del mantenimiento',
        'Documentar mantenimiento realizado',
        'Identificar necesidades de mantenimiento especializado si corresponde',
        'Coordinar mantenimiento especializado si es necesario'
      ],
      successCriteria: [
        'Se identificaron equipos que requieren mantenimiento',
        'Se realizó mantenimiento básico correctamente',
        'Los equipos funcionan correctamente después del mantenimiento',
        'Se documentó el mantenimiento realizado',
        'Se identificaron necesidades de mantenimiento especializado si corresponde'
      ],
      commonErrors: [
        'No realizar mantenimiento de manera periódica',
        'No verificar funcionamiento después del mantenimiento',
        'No documentar mantenimiento realizado',
        'No identificar necesidades de mantenimiento especializado',
        'Intentar reparaciones complejas sin conocimiento adecuado'
      ]
    },
    {
      name: 'Planificación de Producción',
      description: 'Definir qué productos producir, en qué cantidades y según qué especificaciones.',
      roleNames: ['Administrador'],
      frequency: null,
      estimatedTime: 90,
      cost: null,
      type: 'with_role',
      executionSteps: [
        'Analizar demanda y ventas previas',
        'Considerar estacionalidad y tendencias',
        'Revisar disponibilidad de insumos',
        'Definir productos a producir',
        'Definir cantidades para cada producto',
        'Especificar características y especificaciones',
        'Asignar productos a procesos correspondientes',
        'Documentar plan de producción',
        'Comunicar plan a áreas correspondientes'
      ],
      successCriteria: [
        'El plan considera demanda y ventas previas',
        'Se definieron productos y cantidades',
        'Se especificaron características de productos',
        'El plan está documentado',
        'El plan fue comunicado a áreas correspondientes',
        'El plan es realista y factible'
      ],
      commonErrors: [
        'No considerar demanda real al planificar',
        'Planificar cantidades sin considerar insumos disponibles',
        'No especificar características de productos',
        'No documentar el plan de producción',
        'No comunicar el plan a áreas correspondientes',
        'Planificar sin considerar capacidad de producción'
      ]
    }
  ],
  processes: [
    {
      name: 'Producción de Panadería',
      areaName: 'Producción',
      objective: 'Elaborar productos de panadería (panes, facturas, bizcochos, etc.) según el Plan de Producción, cumpliendo con estándares de calidad, textura, sabor y presentación.',
      activities: [
        { name: 'Analizar Plan de Producción', taskName: 'Analizar o Conformar Plan de Producción' },
        { name: 'Revisar Insumos', taskName: 'Revisar Insumos Necesarios para la Producción' },
        { name: 'Preparar Subproductos', taskName: 'Preparación de Subproductos (Mise en Place)' },
        { name: 'Producir Productos', taskName: 'Producir Productos del Proceso' },
        { name: 'Ordenar y Limpiar', taskName: 'Ordenar y Limpiar Área de Trabajo' }
      ],
      employeeNames: ['Jorge']
    },
    {
      name: 'Producción de Sándwiches y Productos Afines',
      areaName: 'Producción',
      objective: 'Elaborar sándwiches y productos afines según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      activities: [
        { name: 'Analizar Plan de Producción', taskName: 'Analizar o Conformar Plan de Producción' },
        { name: 'Revisar Insumos', taskName: 'Revisar Insumos Necesarios para la Producción' },
        { name: 'Preparar Subproductos', taskName: 'Preparación de Subproductos (Mise en Place)' },
        { name: 'Producir Productos', taskName: 'Producir Productos del Proceso' },
        { name: 'Empaquetar Productos', taskName: 'Empaquetar Productos Producidos' },
        { name: 'Trasladar a Ventas', taskName: 'Trasladar Productos al Área de Ventas' },
        { name: 'Ordenar y Limpiar', taskName: 'Ordenar y Limpiar Área de Trabajo' }
      ],
      employeeNames: ['Marbelis']
    },
    {
      name: 'Producción de Rotisería Tradicional',
      areaName: 'Producción',
      objective: 'Elaborar productos de rotisería tradicional según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      activities: [
        { name: 'Analizar Plan de Producción', taskName: 'Analizar o Conformar Plan de Producción' },
        { name: 'Revisar Insumos', taskName: 'Revisar Insumos Necesarios para la Producción' },
        { name: 'Preparar Subproductos', taskName: 'Preparación de Subproductos (Mise en Place)' },
        { name: 'Producir Productos', taskName: 'Producir Productos del Proceso' },
        { name: 'Empaquetar Productos', taskName: 'Empaquetar Productos Producidos' },
        { name: 'Trasladar a Ventas', taskName: 'Trasladar Productos al Área de Ventas' },
        { name: 'Ordenar y Limpiar', taskName: 'Ordenar y Limpiar Área de Trabajo' }
      ],
      employeeNames: ['Marcelo', 'Yuneisis']
    },
    {
      name: 'Producción de Menús y Platos Variables',
      areaName: 'Producción',
      objective: 'Elaborar menús y platos variables según el Plan de Producción, asegurando calidad, presentación y disponibilidad para la venta.',
      activities: [
        { name: 'Analizar Plan de Producción', taskName: 'Analizar o Conformar Plan de Producción' },
        { name: 'Revisar Insumos', taskName: 'Revisar Insumos Necesarios para la Producción' },
        { name: 'Preparar Subproductos', taskName: 'Preparación de Subproductos (Mise en Place)' },
        { name: 'Producir Productos', taskName: 'Producir Productos del Proceso' },
        { name: 'Empaquetar Productos', taskName: 'Empaquetar Productos Producidos' },
        { name: 'Trasladar a Ventas', taskName: 'Trasladar Productos al Área de Ventas' },
        { name: 'Ordenar y Limpiar', taskName: 'Ordenar y Limpiar Área de Trabajo' }
      ],
      employeeNames: ['Marcelo', 'Yuneisis']
    },
    {
      name: 'Apertura de Caja',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Preparar el sistema de punto de venta y caja para iniciar operaciones, verificando que todos los elementos necesarios estén disponibles y funcionando correctamente.',
      activities: [
        { name: 'Apertura de Caja', taskName: 'Apertura de Caja' }
      ],
      employeeNames: ['Marlenis', 'Anisley']
    },
    {
      name: 'Atención a Clientes por Plataformas en Línea y Venta',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Atender pedidos recibidos a través de plataformas en línea, procesar las ventas, coordinar la preparación y entrega de productos.',
      activities: [
        { name: 'Atender Pedidos en Línea', taskName: 'Atención de Pedidos por Plataformas en Línea' }
      ],
      employeeNames: ['Marlenis', 'Anisley', 'Félix Manuel']
    },
    {
      name: 'Reposición de Vitrinas',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Reponer productos en las vitrinas del local de venta, asegurando disponibilidad y presentación adecuada.',
      activities: [
        { name: 'Revisar Vitrinas', taskName: 'Revisar Vitrinas del Local de Venta' },
        { name: 'Limpiar Área de Ventas', taskName: 'Limpieza de Área de Ventas' }
      ],
      employeeNames: ['Marlenis', 'Anisley', 'Félix Manuel']
    },
    {
      name: 'Atención al Cliente y Venta',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Atender a los clientes y procesar ventas.',
      activities: [
        { name: 'Atender Clientes', taskName: 'Atención al Cliente y Venta' },
        { name: 'Limpiar Área de Ventas', taskName: 'Limpieza de Área de Ventas' }
      ],
      employeeNames: ['Marlenis', 'Anisley', 'Félix Manuel']
    },
    {
      name: 'Cierre de Caja',
      areaName: 'Ventas y Atención al Cliente',
      objective: 'Cerrar el sistema de punto de venta y caja al finalizar operaciones.',
      activities: [
        { name: 'Cierre de Caja', taskName: 'Cierre de Caja' }
      ],
      employeeNames: ['Marlenis', 'Anisley']
    },
    {
      name: 'Compra',
      areaName: 'Administración y Gestión',
      objective: 'Adquirir insumos, materias primas, materiales para producción y productos para reventa.',
      activities: [
        { name: 'Comprar Insumos y Productos', taskName: 'Compra de Insumos y Productos' }
      ],
      employeeNames: [] // Tarea con rol "Administrador" - no hay empleado con ese rol específico
    },
    {
      name: 'Contabilidad',
      areaName: 'Administración y Gestión',
      objective: 'Llevar la contabilidad del negocio, registrando operaciones financieras y cumpliendo obligaciones fiscales.',
      activities: [
        { name: 'Contabilidad', taskName: 'Contabilidad' }
      ],
      employeeNames: ['Salvador']
    },
    {
      name: 'Limpieza General',
      areaName: 'Administración y Gestión',
      objective: 'Mantener limpias y en condiciones adecuadas las áreas comunes del negocio (baños, pisos, pasillos y otros espacios compartidos), asegurando condiciones de higiene y orden para el funcionamiento general del negocio.',
      activities: [
        { name: 'Limpieza de Áreas Comunes', taskName: 'Limpieza General de Áreas Comunes' }
      ],
      employeeNames: ['Yamilka']
    },
    {
      name: 'Mantenimiento Básico',
      areaName: 'Administración y Gestión',
      objective: 'Realizar mantenimiento básico de equipos, instalaciones y sistemas.',
      activities: [
        { name: 'Mantenimiento de Equipos', taskName: 'Mantenimiento Básico de Equipos e Instalaciones' }
      ],
      employeeNames: [] // Pendiente de definir empleados específicos
    },
    {
      name: 'Preparación de Insumos y Tareas Periódicas',
      areaName: 'Administración y Gestión',
      objective: 'Tareas periódicas de preparación que no forman parte de procesos diarios.',
      activities: [
        { name: 'Rallar Pan', taskName: 'Rallar Pan' }
      ],
      employeeNames: ['Salvador'] // Tarea con rol "Encargado Contable"
    },
    {
      name: 'Planificación de Producción',
      areaName: 'Administración y Gestión',
      objective: 'Definir qué productos producir, en qué cantidades y según qué especificaciones.',
      activities: [
        { name: 'Planificar Producción', taskName: 'Planificación de Producción' }
      ],
      employeeNames: [] // Tarea con rol "Administrador" - no hay empleado con ese rol específico
    }
  ]
};

// Initialize system structure
async function initializeSystem() {
  try {
    showSpinner('Inicializando sistema...');
    
    // Step 1: Initialize company info structure
    const existingCompanyInfo = await nrd.companyInfo.get();
    
    if (!existingCompanyInfo) {
      await nrd.companyInfo.set({
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
    const existingAreas = await nrd.areas.getAll();
    const areaNameToId = {};
    
    for (const areaData of initialData.areas) {
      // Check if area already exists by name
      const existingArea = Object.entries(existingAreas || {}).find(([id, area]) => area.name === areaData.name);
      
      if (existingArea) {
        areaNameToId[areaData.name] = existingArea[0];
      } else {
        const newAreaId = await nrd.areas.create({
          name: areaData.name,
          description: areaData.description,
          managerEmployeeId: null
        });
        areaNameToId[areaData.name] = newAreaId;
      }
    }
    
    // Step 3: Create roles
    const existingRoles = await nrd.roles.getAll();
    const roleNameToId = {};
    
    for (const roleName of initialData.roles) {
      // Check if role already exists by name
      const existingRole = Object.entries(existingRoles || {}).find(([id, role]) => role.name === roleName);
      
      if (existingRole) {
        roleNameToId[roleName] = existingRole[0];
      } else {
        const newRoleId = await nrd.roles.create({
          name: roleName,
          description: null
        });
        roleNameToId[roleName] = newRoleId;
      }
    }
    
    // Step 4: Create employees
    const existingEmployees = await nrd.employees.getAll();
    const employeeNameToId = {};
    
    for (const employeeData of initialData.employees) {
      // Check if employee already exists by name
      const existingEmployee = Object.entries(existingEmployees || {}).find(([id, emp]) => emp.name === employeeData.name);
      
      if (existingEmployee) {
        employeeNameToId[employeeData.name] = existingEmployee[0];
        // Update roleIds if needed
        const roleIds = employeeData.roleNames.map(rn => roleNameToId[rn]).filter(Boolean);
        if (roleIds.length > 0) {
          await nrd.employees.update(existingEmployee[0], { roleIds });
        }
      } else {
        const roleIds = employeeData.roleNames.map(rn => roleNameToId[rn]).filter(Boolean);
        const newEmployeeId = await nrd.employees.create({
          name: employeeData.name,
          roleIds: roleIds.length > 0 ? roleIds : null,
          email: null,
          phone: null
        });
        employeeNameToId[employeeData.name] = newEmployeeId;
      }
    }
    
    // Step 5: Create tasks
    const existingTasks = await nrd.tasks.getAll();
    const taskNameToId = {};
    
    for (const taskData of initialData.tasks) {
      // Check if task already exists by name
      const existingTask = Object.entries(existingTasks || {}).find(([id, task]) => task.name === taskData.name);
      
      if (existingTask) {
        taskNameToId[taskData.name] = existingTask[0];
      } else {
        // Type and roles are now configured in processes, not stored in tasks
        const taskToCreate = {
          name: taskData.name,
          description: taskData.description || null,
          frequency: taskData.frequency || null,
          estimatedTime: taskData.estimatedTime || null,
          // Cost is calculated automatically based on roles and employee salaries, not stored
          cost: null,
          executionSteps: taskData.executionSteps || null,
          successCriteria: taskData.successCriteria || null,
          commonErrors: taskData.commonErrors || null
          // Type and roleIds are now configured in processes through activities, not stored in tasks
        };
        
        const newTaskId = await nrd.tasks.create(taskToCreate);
        taskNameToId[taskData.name] = newTaskId;
      }
    }
    
    // Step 6: Create processes
    const existingProcesses = await nrd.processes.getAll();
    
    for (const processData of initialData.processes) {
      // Check if process already exists by name
      const existingProcess = Object.entries(existingProcesses).find(([id, proc]) => proc.name === processData.name);
      
      if (!existingProcess) {
        const areaId = areaNameToId[processData.areaName];
        if (!areaId) {
          console.warn(`Area "${processData.areaName}" not found for process "${processData.name}"`);
          continue;
        }
        
        // Get activities with task IDs and role IDs
        // Each activity must have: name, taskId (idTask), roleId (idRol)
        // Roles are now configured in process activities, not in tasks
        const activities = [];
        if (processData.activities && Array.isArray(processData.activities)) {
          processData.activities.forEach(activity => {
            const taskId = taskNameToId[activity.taskName];
            if (taskId) {
              // Get task data to find its roles (from initialData, not from stored task)
              const taskData = initialData.tasks.find(t => t.name === activity.taskName);
              let roleId = null;
              
              // If activity specifies a roleName, use it; otherwise use first role from task's roleNames
              if (activity.roleName) {
                roleId = roleNameToId[activity.roleName] || null;
              } else if (taskData && taskData.roleNames && taskData.roleNames.length > 0) {
                // Use first role from task's roleNames as default
                roleId = roleNameToId[taskData.roleNames[0]] || null;
              }
              
              // Activity structure: name, taskId (idTask), roleId (idRol)
              activities.push({
                name: activity.name,
                taskId: taskId,
                roleId: roleId
              });
            }
          });
        } else if (processData.taskNames) {
          // Backward compatibility: convert old taskNames to activities
          processData.taskNames.forEach((taskName, index) => {
            const taskId = taskNameToId[taskName];
            if (taskId) {
              // Get task data to find its roles (from initialData, not from stored task)
              const taskData = initialData.tasks.find(t => t.name === taskName);
              let roleId = null;
              
              if (taskData && taskData.roleNames && taskData.roleNames.length > 0) {
                // Use first role from task's roleNames as default
                roleId = roleNameToId[taskData.roleNames[0]] || null;
              }
              
              // Activity structure: name, taskId (idTask), roleId (idRol)
              activities.push({
                name: taskName, // Use task name as activity name for backward compatibility
                taskId: taskId,
                roleId: roleId
              });
            }
          });
        }
        
        const processToCreate = {
          name: processData.name,
          areaId: areaId,
          objective: processData.objective || null,
          activities: activities.length > 0 ? activities : null
        };
        
        await nrd.processes.create(processToCreate);
      }
    }
    
    // Step 7: Initialize contracts structure (empty if doesn't exist)
      // Contracts will be created by user, no default structure needed
    
    hideSpinner();
    await showSuccess('Sistema inicializado exitosamente con datos base.');
    
    // Reload the app to show initialized structure
    location.reload();
  } catch (error) {
    hideSpinner();
    await showError('Error al inicializar: ' + error.message);
    console.error('Initialize error:', error);
    throw error;
  }
}

// Initialize button handler removed - button no longer exists in UI
