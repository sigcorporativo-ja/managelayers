import namespace from 'mapea-util/decorator';
import ManageLayersImplControl from 'impl/managelayersControl.js';
import * as cssEscape from 'css.escape';
@namespace("M.control")
export default class ManageLayersControl extends M.Control {


  /**
   * Name to identify this control
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  static get NAME() {
    return 'ManageLayers';
  }

  /**
   * Name to identify url template
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  static get TEMPLATE() {
    return 'template_managelayers_control.html';
  }

  /**
   * Configuracion basica de control
   */
  static get CONFIG_BASE() {
    return {
      controlName: ManageLayersControl.NAME,
      template: ManageLayersControl.TEMPLATE,
      iconClass: 'g-cartografia-capas2',
      tooltip: 'Gestor capas'
    };
  }

  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor (impl, params, options) {
    // 1. checks if the implementation can create ManageLayersControl
    if (M.utils.isUndefined(M.impl.control.ManageLayersControl)) {
      M.exception('La implementación usada no puede crear controles ManageLayersControl');
    }

    super(impl, options.controlName);

    /**
     * Params of the control
     * @private
     * @type {params}
     */
    this.params_ = params || {};


    /**
     * Opciones para el control:
     *
     * 		A establecer desde cada control:
     * 			controlName: Nombre (ID) del control mapea
     * 			template:	 Template para creacion del control
     * 			baseName:	 Nombre base del control para construccion generica del control (si no se indica es el controlName)
     *
     * 		A establecer por el usuario:
     * 			iconClass: 	 Icono representacion del control
     *			tooltip: 	 Tooltip del control
     * @private
     * @type {options}
     */
    this.options_ = this.getControlOptions_(options);
  }
  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      M.template.compile(this.options_.template, {
        //'jsonp': true,
        vars: this.options_
      }).then((html) => {
        let content = null;
        //Si se indica configuracion para toolbar: annadir control en toolbar, si no annadir control al panel
        if (!M.utils.isNullOrEmpty(this.options_.toolbar)) {
          let toolbar = this.options_.toolbar;
          //Annadir toolbar si no esta
          let isLoad = !M.utils.isNullOrEmpty(this.getPanel()._element.querySelector(toolbar.selector));
          if (isLoad === false) {
            this.getPanel()._controlsContainer.appendChild(toolbar.target);
          }
          //Cargar contenido del control en las zonas del toolbar: boton y contenido por separado
          let button = html.querySelector(this.getSelectorToolbarButton_());
          let container = html.querySelector(this.getSelectorToolbarContainer_());
          toolbar.target.querySelector(toolbar.selectorBtn).appendChild(button);
          toolbar.target.querySelector(toolbar.selectorContainer).appendChild(container);
          content = toolbar.target;
        } else {
          //Cargamos el control en el panel
          content = html;
          this.getPanel()._controlsContainer.appendChild(html);
        }
        //Establecer eventos
        this.addEvents(content);
        success(content);
      });
    });
  }

  /**
   * @public
   * @function
   * @param {HTMLElement} html to add the plugin
   * @api stable
   * @export
   */
  getActivationButton(html) {
    return html.querySelector('button#m-managelayerscontrol-button');
  }

  activate() {
    //Mostrar panel de contenido asociado
    this.getToolbarContainer_().classList.toggle('dNone');
    this.getControlButton_().classList.toggle('active');
    //Mostrar titulo del contenido asociado
    this.getTitleControlManageLayers_().innerText = this.options_.tooltip;
    super.activate();
  }

  deactivate() {
    //Ocultar panel de contenido asociado
    this.getToolbarContainer_().classList.toggle('dNone');
    this.getControlButton_().classList.toggle('active');
    super.deactivate();
  }

  getControlOptions_(options) {
    options = options || {};
    //Merge opciones de usuario con configuracion basica y con la configuracion especifica del plugin
    let opt_ = M.utils.extend({}, ManageLayersControl.CONFIG_BASE, true);
    opt_ = M.utils.extend(opt_, options, true);
    //_Identificador base del control: si no se indica sera el nombre del control en minusculas
    opt_.baseName = ((M.utils.isNullOrEmpty(opt_.baseName)) ? opt_.controlName : opt_.baseName);
    opt_.baseName = (opt_.baseName).toLowerCase();

    return opt_;
  }

  getConfigDefault_() {
    return this.CONFIG_BASE;
  }

  addEvents(html) { }

  render() { }

  /**
   * This function returns the HTML button control.
   *
   * @public
   * @function
   * @param {HTMLElement} element - Template control
   * @returns {HTMLElement} HTML control button
   * @api stable
   * @export
   */
  getActivationButton(html) {
    return html.querySelector(this.getSelectorButton_());
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @param {*} obj - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof ManageLayersControl) {
      equals = (this.name === obj.name);
    }
    return equals;
  }


  //Id toolbar botones del control
  getSelectorToolbarButton_() {
    return '#toolbar-button-' + this.options_.baseName;
  }
  //Id toolbar contenido del control;
  getSelectorToolbarContainer_() {
    return '#toolbar-container-' + this.options_.baseName;
  }
  //Id bton accion del control
  getSelectorButton_() {
    return '#tool-btn-' + this.options_.baseName;
  }
  //Id panel contenido del control
  getSelectorContainer_() {
    return '#tool-' + this.options_.baseName;
  }
  //Obtener item del DOM: toolbar del control
  getToolbarContainer_() {
    return this.getPanel()._element.querySelector(this.getSelectorToolbarContainer_());
  }
  //Obtener item del DOM: panel detalle del control
  getControlContainer_() {
    return this.getPanel()._element.querySelector(this.getSelectorContainer_());
  }
  //Obtener item del DOM: boton del control
  getControlButton_() {
    return this.getPanel()._element.querySelector(this.getSelectorButton_());
  }
  //Obtener el item de titulo del subplugin activo
  getTitleControlManageLayers_() {
    return this.getPanel()._element.querySelector('#toolbar-title-managelayers');
  }

  //Obtiene opciones de configuracion del control
  getOptionsControlManageLayers(item) {
    return this.getOptionsManageLayers(item, (this.name).toLowerCase());
  }
  //Establece opciones de configuracion del control
  setOptionsControlManageLayers(item, options) {
    this.setOptionsManageLayers(item, options, (this.name).toLowerCase());
  }
  getOptionsManageLayers(item, name) {
    let options = item.options.manageLayers;
    if (!M.utils.isNullOrEmpty(name) && !M.utils.isNullOrEmpty(options))
      options = options[name];
    return options;
  }
  setOptionsManageLayers(item, options, name) {
    if (M.utils.isNullOrEmpty(item.options.manageLayers))
      item.options.manageLayers = {};

    if (!M.utils.isNullOrEmpty(name))
      item.options.manageLayers[name] = options;
    else
      item.options.manageLayers = options;
  }
  resetOptionsManageLayers(layer) {
    layer.options.manageLayers = {};
  }
  //Obtiene elemento del DOM escapando caracteres (no validos para busqueda por CSS)
  getQuerySelectorScapeCSS(target, selector, name) {
    return target.querySelector(selector + CSS.escape(name));
  }

  activateLoading() {
    this.getPanel()._element.querySelector('#m-waiting-result').classList.remove('dNone');
    this.getPanel()._element.querySelector('.m-toolbar-containers-managelayers').style.minHeight = '70px';
  }
  deactivateLoading() {
    this.getPanel()._element.querySelector('#m-waiting-result').classList.add('dNone');
    this.getPanel()._element.querySelector('.m-toolbar-containers-managelayers').style.minHeight = 'initial';
  }

  //********** FUNCIONES GENERALES DE GESTION DE CAPAS *********
  addLayers(layers) {
    this.map_.addLayers(layers);
  }

  removeLayers(layers) {
    //FIXME: CORRECION MAPEA:
    //this.map_.removeLayers(layer);
    //No usamos el metodo removelayer del map porque tiene programado de forma interna la indentificacion de la capa
    //NO usa el ID por lo que si hay varias capas iguales (con distinto ID) las borra todas
    //Definimos nuevo metodo que elimine directamente el elemento enviado, que es el que se quiere quitar, no hay que buscarlo
    this.map_.getImpl().removeItemLayers(layers);
  }

  //Determina si la capa indicada esta cargada (capa activa)
  isLoadLayer(layer) {
    let isLoad = false;
    let item = this.findLayerById(layer.id);
    if (item != null)
      isLoad = true;
    return isLoad;
  }
  //Buscar capa por nombe en las capas cargadas (activas)
  findLayerByName(layerName) {
    return this.findItemByProperty(this.map_.getLayers(), 'name', layerName);
  }
  //Buscar capa por id en las capas cargadas (activas)
  findLayerById(layerId) {
    return this.findItemByProperty(this.map_.getLayers(), 'id', layerId);
  }
  //Buscar en lista de elementos un item que coincida en la propiedad indicada el valor buscado
  findItemByProperty(lstItems, itemProperty, itemValue) {
    let item = null;
    if (lstItems && itemProperty) {
      lstItems.some((it) => {
        if (it[itemProperty] === itemValue) {
          item = it;
          return true;
        }
      });
    }
    return item;
  }

}