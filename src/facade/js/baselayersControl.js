import namespace from 'mapea-util/decorator';
import BaseLayersImplControl from 'impl/baselayersControl';
import ManageLayersControl from './managelayersControl.js';

@namespace("M.control")
export default class BaseLayersControl extends ManageLayersControl {


    /**
     * Name to identify this control
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    static get NAME() {
        return 'BaseLayers';
    }

    /**
     * Name to identify url template
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    static get TEMPLATE() {
        return 'baselayers.html';
    }

    static get BASEMAP_BLANCO() {
        return 'base_blanco';
    }
    static get IMG_BASEMAP_DEFAULT() {
        return 'assets/img/default.png';
    }
    static get IMG_BASEMAP_WHITE() {
        return 'assets/img/osm.png';
    }

    /**
     * @classdesc
     * Main constructor of the class. Creates a BaseLayersControl
     * control
     *
     * @constructor
     * @extends {M.Control}
     * @api stable
     */
    constructor(params, options) {
        // 1. checks if the implementation can create BaseLayersControl
        if (M.utils.isUndefined(M.impl.control.BaseLayersControl)) {
            M.exception('La implementación usada no puede crear controles BaseLayersControl');
        }
        let opt_ = {
            controlName: BaseLayersControl.NAME,
            iconClass: 'g-cartografia-localizacion',
            tooltip: 'Mapas base'
        };
        // Se annaden los parametros de control a las opciones
        options = M.utils.extend(opt_, options, true);
        // 2. implementation of this control
        let impl = new M.impl.control.BaseLayersControl();

        super(impl, params, options);

        /**
         * Params of the control
         * @private
         * @type {params}
         */
        this.params_ = params || {};

        this.map_ = null;
        this.baseMaps_ = [];
        this.mapaActivo = null;
        this.activatedBlankMap = null;
    }

    addTo(map) {
        super.addTo(map);
        this.map_ = map;
        this.baseMaps_ = this.loadConfigInicial();
        this.activatedBlankMap = !M.utils.isNullOrEmpty(this.params_.activatedBlankMap) ? this.params_.activatedBlankMap : true;
        //Si no hay mapa activo, establecer seleccion por defecto
        if (M.utils.isNullOrEmpty(this.mapaActivo) && this.activatedBlankMap) {
            this.mapaActivo = BaseLayersControl.BASEMAP_BLANCO;
        }
        this.renderPanel();
    }

    render() {
        //No es necesario actualizar el panel cada vez que cargamos el control(no hya cambios que actualziar)
        //El metodo render() que se usa al activar el control vacio, y solo al annadir llamamos una vez para construir inicialmente el panel
    }

    renderPanel() {
        let tempVars= this.getTemplateVariables_();

        M.template.compile(BaseLayersControl.TEMPLATE, {
            //'jsonp' : true,
            'vars': tempVars
        }).then((html) => {
            this.getControlContainer_().innerHTML = html.innerHTML;
            /*           //Establecer mapa activo
                      if (!M.utils.isNullOrEmpty(this.mapaActivo)) {
                          let selectItem = this.getControlContainer_().querySelector('[data-id=' + this.mapaActivo + ']');
                          selectItem.click();
                      } */
        });
    }

    /**
     * Gets the variables of the template to compile
     */
    getTemplateVariables_() {
        //Generar lista de mapas base
        let baseLayers = this.baseMaps_;
        let configTemplate = {
            'baseLayers': baseLayers.map(this.parseLayerForTemplate_, this)
        };
        if (this.activatedBlankMap) {
            configTemplate.baseMapBlanco = {
                id: BaseLayersControl.BASEMAP_BLANCO,
                activo: BaseLayersControl.BASEMAP_BLANCO == this.mapaActivo
            };
        }
        return configTemplate;
    }


    /**
     * This function checks if an object is equals
     * to this control
     *
     * @private
     * @function
     */
    parseLayerForTemplate_(baseMap) {
        let layer = baseMap.layer;
        //Nombre(Titulo) mapa
        let title = layer.legend;
        if (M.utils.isNullOrEmpty(title))
            title = layer.name;
        if (M.utils.isNullOrEmpty(title))
            title = 'Mapa base';
        let descripcion = layer.options.descripcion;
        if (M.utils.isNullOrEmpty(descripcion))
            descripcion = 'Imagen mapa base - ' + title;
        let urlImg = baseMap.img;
        let activo = (this.mapaActivo === layer.id);
        return {
            'id': layer.id,
            'title': title,
            'descripcion': descripcion,
            'img': urlImg,
            'activo': activo
        };
    }

    addEvents(html) {
        let content = html.querySelector(this.getSelectorContainer_());
        content.addEventListener("click", (evt) => this.clickBaseLayer(evt));
    }

    clickBaseLayer(evt) {
        evt = (evt || window.event);
        let itemTarget = evt.target;
        if (!M.utils.isNullOrEmpty(itemTarget)) {
            //Cambio de mapa base
            if (itemTarget.classList.contains('m-accion-baselayers-load')) {
                evt.stopPropagation();
                let id = itemTarget.getAttribute('data-id');
                if (!M.utils.isNullOrEmpty(id)) {
                    //Obtenemos el elemento activo
                    let activeItem = this.getControlContainer_().querySelector('.baseActivo');
                    let activeId = ((activeItem) ? activeItem.getAttribute('id') : null);
                    //Establecer mapa base seleccionado
                    if (id != activeId) {

                        //Establecer mapa base seleccionado
                        let selectItem = this.getControlContainer_().querySelector('#' + id);
                        selectItem.classList.toggle('baseActivo');

                        try {
                            //Si tenemos capa la annadimos (puede ser mapa en blanco, no annade capa)
                            let selectMap = this.findItemByProperty(this.baseMaps_, 'id', id);
                            if (selectMap && selectMap.layer) {
                                // this.addLayers(selectMap.layer);
                                //Hack a mapea, que pone invisible la capa si ya hay una capa base activa
                                selectMap.layer.setVisible(true);
                            }
                        } catch (error) {
                            console.log(error);
                        }

                        try {
                            //Eliminar seleccion mapa base actual
                            if (activeId) {
                                activeItem.classList.toggle('baseActivo');
                                let activeMap = this.findItemByProperty(this.baseMaps_, 'id', activeId);
                                activeMap.layer.setVisible(false);
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
            }
        }
    }

    //Establece la configuracion inicial para el funcionamiento del control
    loadConfigInicial() {
        let baseMaps = this.params_.baseMaps;
        let bmapLoaded = false;
        // Annadimos las posibles capas base que haya en el mapa, como las del wmc
        let loadedBaseMaps = this.map_.getBaseLayers().map((layer) => {
            return {
                img: "",
                layer: layer
            };
        });
        if (loadedBaseMaps.length) {
            for (let i = 0; i < loadedBaseMaps.length; i++) {
                // Pongo como activa la primera y elimino del mapa las otras
                if (i == 0) {
                    loadedBaseMaps[0].activo = true;
                    bmapLoaded = true;
                } else {
                    loadedBaseMaps[i].layer.setVisible(false);
                }
            }
            // Elimino cualquier otra capa activa que viniera por configuración
            for (let bl of baseMaps) {
                bl.activo = false;
            }
            baseMaps = [...baseMaps, ...loadedBaseMaps];
        }

        if (M.utils.isNullOrEmpty(baseMaps))
            baseMaps = [];
        // parses parameters to Array
        if (!M.utils.isArray(baseMaps))
            baseMaps = [baseMaps];

        let maps = baseMaps.map((itemMap, index) => {
            // Pongo el z_index a 0
            itemMap.layer.setZIndex(0);
            //Id mapa
            itemMap.id = 'base_' + index;
            //Procesar seleccion mapa base por defecto
            if ((itemMap.activo === true) && M.utils.isNullOrEmpty(this.mapaActivo)) {
                this.mapaActivo = itemMap.id;
                if (!bmapLoaded) {
                    this.addLayers(itemMap.layer);
                }
            }
            // Comprobar si tiene una imagen asignada
            if (M.utils.isNullOrEmpty(itemMap.img))
                itemMap.img = this.getImgLayer(itemMap.layer);
            //Capa asociada al mapa
            let baseLayer;
            if (itemMap.layer instanceof M.Layer)
                baseLayer = itemMap.layer;
            else {
                try {
                    //Si no es un obj Layer: obtener configuracion y creamos objeto
                    let parameter = M.parameter.layer(itemMap.layer);
                    if (!M.utils.isNullOrEmpty(parameter.type))
                        baseLayer = new M.layer[parameter.type](itemMap.layer);
                    else
                        M.dialog.error('No se ha especificado un tipo válido para la capa');
                } catch (err) {
                    M.dialog.error('El formato de la capa (' + itemMap.layer + ') no se reconoce');
                }
            }

            //Establecer ID de layer si no tiene
            if (M.utils.isNullOrEmpty(baseLayer.id)) {
                baseLayer.id = itemMap.id;
            }


            //FIXME: Creamos todas las capas como overlays no consultables y simplemente colocamos en ultima posicion
            //La gestion interna de capas base hace efectos raros con los zoom
            baseLayer.isbaseLayer = true;
            baseLayer.transparent = false;
            if (M.utils.isUndefined(baseLayer.options))
                baseLayer.options = {};
            baseLayer.options.queryable = false;

            //Establecer layer configurada
            itemMap.layer = baseLayer;

            return itemMap;
        });
        return maps;
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
        if (obj instanceof BaseLayersControl) {
            equals = (this.name === obj.name);
        }
        return equals;
    }

    getImgLayer(layer) {
        if (layer.type === M.layer.type.WMS) {
            const legend = layer.getLegendURL();
            if (legend) {
                return legend;
            } else {
                return layer.url + (layer.url.indexOf("?") > -1 ? '&' : '?') + "service=WMS&request=GetMap" +
                    "&layers=" + layer.name +
                    "&bbox=" + this.map_.getMaxExtent() +
                    "&width=200&height=120&version=1.1.1" +
                    "&srs=" + this.map_.getProjection().code + "&format=image/png";
            }
        } else {
            return BaseLayersControl.IMG_BASEMAP_DEFAULT;
        }

    }


}