import namespace from 'mapea-util/decorator';

@namespace("M.impl.control")
export class BaseLayersControl extends M.impl.Control {
  /**
   * @classdesc
   * Main constructor of the BaseLayersControl.
   *
   * @constructor
   * @extends {M.impl.Control}
   * @api stable
   */
  constructor(params) {
    super();
    this.params_ = params || {};
    this.facadeMap_ = null;
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

  /*
  removeBaseMap = function(id) {
    //Desactivar
    //var baseMap = this.getItemBaseLayer (id);
    //baseMap.setVisible(true);
    this.facadeMap_.removeLayers(id);
  };

  setBaseMap = function(id) {
    //Activar
    //var baseMap = this.getItemBaseLayer (id);
    //baseMap.setVisible(true);
    //baseMap.setZIndex(0);
    this.facadeMap_.addLayers(id);
    id.setZIndex(0);
  };

  getItemBaseLayer = function(id) {
    var layerBase = null;
    //Obtenemos baseLayer indicada
    var lstLayers = this.facadeMap_.getBaseLayers();
    lstLayers.forEach(function (item, index) {
      if (id == item.id) {
        layerBase = item;
        return;
      }
    }, this);
    return layerBase;
  };
  */

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
  };

}