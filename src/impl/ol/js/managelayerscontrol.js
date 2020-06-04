/**
 * @module M/impl/control/ManageLayersControl
 */
export default class ManageLayersControl extends M.impl.Control {
  /**
   * @classdesc
   * Main constructor of the ManageLayersControl.
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
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, element) {
    // specific code
    this.facadeMap_ = map;
    this.element = element;

    // super addTo
    super.addTo(map, element);
  }

  /**
   *
   * @public
   * @function
   * @api stable
   */
  activate() {}

  /**
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {}

  destroy() {
    this.deactivate();
    this.element.remove();
    //this.facadeMap_.removeControls(this);
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
    this.element = null;
  }
}
