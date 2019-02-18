import namespace from 'mapea-util/decorator';

@namespace("M.impl.control")
export class ActiveLayersControl extends M.impl.Control {
  /**
   * @classdesc
   * Main constructor of the ActiveLayersControl.
   *
   * @constructor
   * @extends {M.impl.Control}
   * @api stable
   */
  constructor (params) {
    super();
    this.params_ = params || {};
    this.facadeMap_ = null;
    this.totalActiveLayers_ = 0;
  }
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the plugin
   * @param {HTMLElement} element of the plugin
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.element = element;

    let olMap = map.getMapImpl();
    ol.control.Control.call(this, {
      'element': element,
      'target': null
    });
    olMap.addControl(this);
  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    //Actilet eventos
    this.registerEvents();
  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    //Desactilet eventos
    this.unregisterEvents();
  }

  /**
   * This function destroys this control, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.deactivate();
    this.element.remove();
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
    this.element = null;
  }

  /**
   * Registers events on map and layers to render the
   * activelayers
   *
   * @public
   * @function
   * @api stable
   */
  registerEvents() {
    if (!M.utils.isNullOrEmpty(this.facadeMap_)) {
      let olMap = this.facadeMap_.getMapImpl();

      this.registerViewEvents_(olMap.getView());
      this.registerLayersEvents_(olMap.getLayers());

      olMap.on('change:view', (evt) => this.onViewChange_(evt) );
    }
  }

  /**
   * Unegisters events for map and layers from the activelayers
   *
   * @public
   * @function
   * @api stable
   */
  unregisterEvents() {
    if (!M.utils.isNullOrEmpty(this.facadeMap_)) {
      let olMap = this.facadeMap_.getMapImpl();

      this.unregisterViewEvents_(olMap.getView());
      this.unregisterLayersEvents_(olMap.getLayers());
      olMap.un('change:view', (evt) => this.onViewChange_(evt) );
    }
  }

  /**
   * TODO
   */
  registerViewEvents_(view) {
    view.on('change:resolution', () => this.renderPanel() );
  }

  /**
   * TODO
   */
  registerLayersEvents_(layers) {
    layers.forEach( (ly) => this.registerLayerEvents_(ly) );
    layers.on('remove', () => this.renderPanel() );
    layers.on('add', (evt) => this.onAddLayer_(evt) );

  }

  /**
   * TODO
   */
  registerLayerEvents_(layer) {
    layer.on('change:visible', () => this.renderPanel() );
    layer.on('change:extent', () => this.renderPanel() );
  }

  /**
   * TODO
   */
  unregisterViewEvents_(view) {
    view.un('change:resolution', () => this.renderPanel() );
  }

  /**
   * TODO
   */
  unregisterLayersEvents_(layers) {
    layers.forEach( (ly) => this.registerLayerEvents_(ly) );
    layers.un('remove', () => this.renderPanel() );
    layers.un('add', (evt) => this.onAddLayer_(evt));
  }

  /**
   * TODO
   */
  unregisterLayerEvents_(layer) {
    layer.un('change:visible', () => this.renderPanel () );
    layer.un('change:extent', () => this.renderPanel() );
  }

  /**
   * TODO
   */
  onViewChange_(evt) {
    // removes listener from previous view
    this.unregisterViewEvents_(evt.oldValue);
    // attaches listeners to the new view
    let olMap = this.facadeMap_.getMapImpl();
    this.registerViewEvents_(olMap.getView());
  }

  /**
   * TODO
   */

  onAddLayer_(evt) {
    let ly = evt.element;
    this.registerLayerEvents_(ly);
    ly.setZIndex(this.totalActiveLayers_ + 1); // cualquier capa que se añada la pongo en el top de zindex
    this.renderPanel();
    //setTimeout(() => this.renderPanel());
  }

  renderPanel(evt) {
    //TODO: Tambien se podria obtener el control apartir del mapa con el nombre del control
    this.facadeCtrol_.renderPanel();
  }

  moveLayer(id, oldIndex, newIndex) {
    //Obtenemos posicion de la capa en el array
    // let posLayer = 0;
    let lstLayers = this.getFilterLayerList(false);
    /*     lstLayers.forEach((item, index) => {
          if (id == item.id) {
            posLayer = index;
          }
        }); */

    //Determinar tipo de movimiento
    let avance = newIndex - oldIndex;
    //Bajar capa
    if (avance > 0) {
      //Subir resto de capas una posicion
      for (let i = avance; i > 0; i--) {
        lstLayers[newIndex + 1 - i].setZIndex((lstLayers[newIndex + 1 - i].getZIndex() + 1));
      }
      //Bajar capa a la posicion indicada
      lstLayers[oldIndex].setZIndex((lstLayers[oldIndex].getZIndex() - avance));
    } else {
      avance *= (-1);
      //Bajar resto de capas una posicion
      for (let i = 1; i <= avance; i++) {
        lstLayers[newIndex - 1 + i].setZIndex((lstLayers[newIndex - 1 + i].getZIndex() - 1));
      }
      //Subir capa a la posicion indicada
      lstLayers[oldIndex].setZIndex((lstLayers[oldIndex].getZIndex() + avance));
    }
  }

  updateOrderLayer(layer, order) {
    layer.setZIndex(order);
  }

  /**
   *
   * Devuelve la lista de capas que se mostrarán en las capas activas ordenadas de mayor a menor zindex si reverse está a false,
   * o de menor a mayor zindex si reverse está a true
   * @param {*} reverse
   * @returns
   * @memberof ActiveLayersControl
   */
  getFilterLayerList(reverse) {
    const filterLayers = this.facadeMap_.getLayers().filter((layer) => {
      const isBaseMap = (layer.isBaseMap === true);
      const isDrawLayer = (layer.name === '__draw__');
      /* let isTransparent = true;
      let displayInLayerSwitcher = true; */
      const isTransparent = (layer.transparent === true);
      const displayInLayerSwitcher = (layer.displayInLayerSwitcher === true);
      const isNotWMC = (layer.type !== M.layer.type.WMC);
      const isNotWMSFull = !((layer.type === M.layer.type.WMS) && M.utils.isNullOrEmpty(layer.name));
      if (isBaseMap) {
        this.updateOrderLayer(layer, 0);
      }
      else if (isNotWMC && !isDrawLayer) {
        //Los WMC no tienen indice y layer de dibujos siempre encima
        if (isTransparent === false) {
          this.updateOrderLayer(layer, 1);
        }
        //Capas configuradas como no accesibles desde el gesto de capas: se cargaran y no se podra actuar sobre ellas
        else if (displayInLayerSwitcher === false) {
          this.updateOrderLayer(layer, 2);
        }
      }
      return (!isBaseMap && !isDrawLayer && isTransparent && isNotWMC && isNotWMSFull && displayInLayerSwitcher);
    }).sort((a, b) => {
      const zindexA = a.getZIndex();
      const zindexB = b.getZIndex();
      if (isNaN(zindexA) && isNaN(zindexB)) {
        return 0;
      }
      if (isNaN(zindexA)) { // Si viene un NaN lo pongo en el TOP
        return -1;
      }
      if (isNaN(zindexB)) {
        return 1;
      }
      const sum = zindexA - zindexB;
      return reverse ? sum : -sum;
    }).map((layer, position, arr) => {
      if (reverse) {
        layer.setZIndex(position + 3); // Ordeno realmente desde la posición 3
      } else {
        layer.setZIndex(arr.length + 2 - position); // Ordeno realmente desde la posición 3
      }
      return layer;
    });
    this.totalActiveLayers_ = filterLayers.length;
    return filterLayers;

  }
  /**
   * Asigna un estilo a la capa
   *
   * @param {any} layer
   * @param {any} selectedStyle
   * @memberof ActiveLayersControl
   */
  setLayerStyle(layer, selectedStyle) {
    // Cambiamos el estilo
    layer.getImpl().setSelectedStyle(selectedStyle);
  }
  /**
   * Recupera el link de metadatos de la capa
   *
   * @param {any} layer
   * @returns
   * @memberof ActiveLayersControl
   */
  getMetadataLink(layer) {
    return layer.getImpl().getMetadataURL();
  }
  /**
   * Recupera todos los estilos asociados a una capa a partir de sus capabilities
   *
   * @param {any} layer
   * @returns
   * @memberof ActiveLayersControl
   */
  getStylesLayer(layer) {
    return layer.getImpl().getStylesLayer();
  }
  /**
   * Recupera la posición del estilo seleccionado para la capa dentro de su array de estilos
   *
   * @param {any} layer
   * @memberof ActiveLayersControl
   */
  getLayerStylePosition(layer) {
    return layer.getImpl().selectedStyle_;
  }



}