//******	MODIFICICACION CODIGO NUCLEO DE MAPEA ******

// *************************************
// GESTION DE LAYERS MEDIENTE IDs
// Criterio para establecer igual de objetos para elementos tipo LAYER
// Se modifica para tener en cuenta en primera instancia el parametro id, en caso de no tener id se mantiene procedimiento original de capa elemento
export default class MapeaCoreExtension {

    constructor () { }

    static initMapeaCoreExtension(this_) {
        //FIXME: Modificar funcionalidad original core mapea:
        // 		 Usar id para determinar igualdad de objetos layer
        if (M.utils.isNullOrEmpty(this_.fnEquals_)) {
            //Almacenar funcionalidad original metodo equals de las layer
            this_.fnEquals_ = [];
            this_.fnEquals_[M.layer.type.GeoJSON] = M.layer.GeoJSON.prototype.equals;
            this_.fnEquals_[M.layer.type.KML] = M.layer.KML.prototype.equals;
            this_.fnEquals_[M.layer.type.Mapbox] = M.layer.Mapbox.prototype.equals;
            this_.fnEquals_[M.layer.type.OSM] = M.layer.OSM.prototype.equals;
            this_.fnEquals_[M.layer.type.WFS] = M.layer.WFS.prototype.equals;
            this_.fnEquals_[M.layer.type.WMC] = M.layer.WMC.prototype.equals;
            this_.fnEquals_[M.layer.type.WMS] = M.layer.WMS.prototype.equals;
            this_.fnEquals_[M.layer.type.WMTS] = M.layer.WMTS.prototype.equals;

            //Definimos funcionalidad generica evaluando primero IDs
            let fnEquals_ = this_.fnEquals_;
            let _fn_equals = function (obj) {
                let equals = false;
                //Usar IDs si tiene, sino, repdoducir comportamiento original segun el tipo del objeto
                if (!M.utils.isUndefined(this.id))
                    equals = (this.id === obj.id);
                else
                    equals = fnEquals_[this.type](obj);
                return equals;
            };
            //Establecer nueva funcionalidad teniendo en cuenta IDs
            M.layer.GeoJSON.prototype.equals = _fn_equals;
            M.layer.KML.prototype.equals = _fn_equals;
            M.layer.Mapbox.prototype.equals = _fn_equals;
            M.layer.OSM.prototype.equals = _fn_equals;
            M.layer.WFS.prototype.equals = _fn_equals;
            M.layer.WMC.prototype.equals = _fn_equals;
            M.layer.WMS.prototype.equals = _fn_equals;
            M.layer.WMTS.prototype.equals = _fn_equals;
        }
        // FIN GESTION DE LAYERS MEDIENTE IDs
        // *************************************
    }
    static overrideMapeaCore() {
        // ******************************
        // PROCESO CAPABILITIES
        // Ampliamos funcionalidad existente proceso capabilities
        // @EXTENSION: Incluir funcionalidad getCapabilities para WFS (igual que la actual para WMS)
        M.impl.layer.WFS.prototype.getCapabilities = M.impl.layer.WMS.prototype.getCapabilities;

        // @EXTENSION: Obtener Abstract
        M.impl.layer.WMS.prototype.getAbstractLayer =
            M.impl.layer.WFS.prototype.getAbstractLayer =
            M.impl.layer.WMTS.prototype.getAbstractLayer = function () {
                return new Promise(function (success, fail) {
                    if (!M.utils.isNullOrEmpty(this.abstract_)) {
                        success(this.abstract_);
                    }
                    else {
                        this.getCapabilities().then(function (info) {
                            let infoLayer = null;
                            //TODO: PTE: si se indican varias capas que descripcion obtener ....
                            //Capas WMS/WFS
                            if (!M.utils.isUndefined(info.getInfoCapabilities))
                                infoLayer = info.getInfoCapabilities(this.name);
                            //FIXME: Capas WMTS Verificar si el esquema es correcto o depende de la version ...
                            else if (!M.utils.isUndefined(info.Contents) && info.Contents.Layer)
                                infoLayer = info.Contents.Layer[0];
                            this.abstract_ = ((infoLayer) ? infoLayer.Abstract : '');
                            success(this.abstract_);
                        }.bind(this)).catch(err => fail(err));
                    }
                }.bind(this));
            };

        // @EXTENSION: Obtener Metadatos de la capa
        M.impl.layer.WMS.prototype.getMetadataURL =
            M.impl.layer.WFS.prototype.getMetadataURL = function () {
                return new Promise((success, fail) => {
                    if (!M.utils.isNullOrEmpty(this.metadataLink_)) {
                        success(this.metadataLink_);
                    }
                    else {
                        this.getCapabilities().then((info) => {
                            let infoLayer = null;
                            if (this instanceof M.impl.layer.WMTS) {

                            } else {
                                infoLayer = info.getInfoCapabilities(this.name);
                            }
                            this.metadataLink_ = ((infoLayer) ? (infoLayer.MetadataURL) ? infoLayer.MetadataURL[0].OnlineResource : false : false);
                            // Lo siguiente es un arreglo para poder servir los metadatos de las capas provenientes de Andalucía que no tienen un metadataURL (Practicamente todas)
                            // Para ello, se compara la url base de la capa con las de IECA y Junta de Andalucía, realizando una consulta sobre la capa y recogiendo
                            // el identificador para formar la URL que redirige al geonetwork de la ide de Andalucía.
                            let baseURLs = ['www.ideandalucia.es', 'www.callejerodeandalucia.es', 'www.juntadeandalucia.es'];
                            // Consigo la url base de la capa
                            let baseUrlLayer = document.createElement("a");
                            baseUrlLayer.href = this.url;
                            if (!this.metadataLink_ && baseURLs.indexOf(baseUrlLayer.hostname) > -1) {
                                // URL dónde se busca el uuid de la capa
                                let searchMetadataURL = 'http://www.ideandalucia.es/catalogo/inspire/srv/spa/q';
                                // URL dónde se inserta el uuid y ya redirecciona al metadato completo de la capa
                                let metadataURL = 'http://www.ideandalucia.es/catalogo/inspire/srv/spa/metadata.formatter.html?xsl=metadato_completo&uuid=';
                                M.remote.get(searchMetadataURL, { any: this.name }, { 'jsonp': true }).then((response) => {
                                    // Parseamos el XML devuelto
                                    let parser = new DOMParser();
                                    let xmlDoc = parser.parseFromString(response.text, "text/xml");
                                    // Se recoge el uuid del xml
                                    let uuid = xmlDoc.getElementsByTagName("uuid");

                                    // Si existe se compone el link a los metadatos
                                    if (uuid.length) {
                                        this.metadataLink_ = metadataURL + uuid[0].childNodes[0].nodeValue;
                                    }
                                    success(this.metadataLink_);
                                }).catch(err => fail(err));
                            } else {
                                success(this.metadataLink_);
                            }

                        }).catch(err => fail(err));
                    }
                });
            };

        // @EXTENSION: Obtener Lista de estilos asociados
        M.impl.layer.WMS.prototype.getStylesLayer = function () {
            return new Promise((success, fail) => {
                if (!M.utils.isNullOrEmpty(this.listStyles_)) {
                    success(this.listStyles_);
                } else {
                    this.getCapabilities().then((info) => {
                        let infoLayer = info.getInfoCapabilities(this.name);
                        this.listStyles_ = (!M.utils.isNullOrEmpty(infoLayer)) ? ((!M.utils.isNullOrEmpty(infoLayer.Style)) ? infoLayer.Style : []) : [];
                        // Inicializamos con el estilo por defecto
                        this.selectedStyle_ = 0;
                        if (!M.utils.isNullOrEmpty(this.listStyles_[0]) && !M.utils.isNullOrEmpty(this.listStyles_[0].LegendURL))
                            this.setLegendURL(this.listStyles_[0].LegendURL[0].OnlineResource);
                        // Se recorren todos los estilos por si el usuario hubiese inicializado por paramtros otro estilo
                        this.listStyles_.forEach((style, index) => {
                            // Si se ha configurado un estilo, marcar el índice y establecer la leyenda
                            if (style.Name == this.getOL3Layer().getSource().getParams().STYLES) {
                                this.selectedStyle_ = index;
                                if (!M.utils.isNullOrEmpty(style.LegendURL)) {
                                    this.setLegendURL(style.LegendURL[0].OnlineResource);
                                }
                            }
                        });
                        success(this.listStyles_);
                    }).catch(err => fail(err));
                }
            });
        };
        // @EXTENSION: Obtener estilo seleccionado
        M.impl.layer.WMS.prototype.getSelectedStyle = function () {
            if (!M.utils.isNullOrEmpty(this.listStyles_)) {
                return this.listStyles_[this.selectedStyle_];
            } else {
                return null;
            }
        };
        // @EXTENSION: Establecer estilo seleccionado
        M.impl.layer.WMS.prototype.setSelectedStyle = function (selectedStyle) {
            if (!M.utils.isNullOrEmpty(this.listStyles_)) {
                let style = this.listStyles_[selectedStyle];
                this.getOL3Layer().getSource().updateParams({ STYLES: style.Name });
                this.selectedStyle_ = selectedStyle;
                // Al cambiar el estilo, hay que cambiar la leyenda asociada
                if (!M.utils.isNullOrEmpty(style.LegendURL))
                    this.setLegendURL(style.LegendURL[0].OnlineResource);
            }
        };

        // @EXTENSION: Obtener capabilities asociado a la capa indicada
        M.impl.GetCapabilities.prototype.getInfoCapabilities = function (layerName) {
            let obj = this;
            let key = null;
            let capabilities = null;
            for (key in obj) {
                if (!M.utils.isNullOrEmpty(obj[key]) && !M.utils.isUndefined(obj[key].Capability)) {
                    capabilities = obj[key].Capability;
                    break;
                }
            }

            //Obtenemos informacion del capabilities asociado a la capa
            let info = null;
            if (!M.utils.isNullOrEmpty(capabilities))
                info = this.getInfoCapabilitiesRecursive_(capabilities.Layer, layerName);

            return info;
        };
        //Buscar capa recursivamente por name
        M.impl.GetCapabilities.prototype.getInfoCapabilitiesRecursive_ = function (layer, layerName) {
            let itemInfo = null;
            let i, ilen;
            if (!M.utils.isNullOrEmpty(layer)) {
                // array
                if (M.utils.isArray(layer)) {
                    for (i = 0, ilen = layer.length; (i < ilen) && (itemInfo === null); i++) {
                        itemInfo = this.getInfoCapabilitiesRecursive_(layer[i], layerName);
                    }
                } else if (M.utils.isObject(layer)) {
                    // base case
                    if (M.utils.isNullOrEmpty(layerName) || (layer.Name === layerName)) {
                        itemInfo = layer;
                    }
                    // recursive case
                    else if (!M.utils.isUndefined(layer.Layer)) {
                        itemInfo = this.getInfoCapabilitiesRecursive_(layer.Layer, layerName);
                    }
                }
            }
            return itemInfo;
        };

        // FIN PROCESO CAPABILITIES
        // ******************************

        // ******************************
        // PROCESO ELIMINAR LAYER
        // Modificar funcionalidad actual
        // Se eliminara el objeto layer enviado, no se aplicara busqueda para obtener la layer asociasada
        // Se define metodo generico, y establecemos funcionalidad especifica acorde al codigo actual de mapea segun el tipo de la capa

        // @EXTENSION: Eliminar capas enviadas como parametro
        M.impl.Map.prototype.removeItemLayers = function (layers) {
            if (M.utils.isNullOrEmpty(layers)) {
                layers = [];
            }
            if (!M.utils.isArray(layers)) {
                layers = [layers];
            }
            
            layers.forEach( itemLayer => {
                //JGL: .remove (de ol.Collection) no está funcionando en mapea5
                //this.layers_.remove(itemLayer);
                //usando el filtro de Array funciona en ambos
                this.layers_ = this.layers_.filter( item => item != itemLayer );
               
                if ((itemLayer.type !== M.layer.type.MBtiles) && (itemLayer.type !== M.layer.type.WMC)) {
                    itemLayer.getImpl().destroy();
                }
                if ((itemLayer.type == M.layer.type.KML) && (itemLayer.extract === true)) {
                    this.featuresHandler_.removeLayer(itemLayer.getImpl());
                }
            });

            return this;
        };
        // PROCESO ELIMINAR LAYER
        // ******************************


        // ******************************
        // ELIMINAR CAPA OSM
        // Eliminar bug codigo: falta scope
        // @BUG
        M.impl.layer.OSM.prototype.destroy = function () {
            let olMap = this.map.getMapImpl();
            if (!M.utils.isNullOrEmpty(this.ol3Layer)) {
                olMap.removeLayer(this.ol3Layer);
                this.ol3Layer = null;
            }

            this.map.getLayers().forEach(function (lay) {
                if (lay instanceof M.layer.OSM || lay instanceof M.layer.Mapbox) {
                    this.haveOSMorMapboxLayer = true;
                }
            }, this);

            if (!this.haveOSMorMapboxLayer) {
                this.map.getImpl().getMapImpl().getControls().getArray().forEach(function (data) {
                    if (data instanceof ol.control.Attribution) {
                        this.map.getImpl().getMapImpl().removeControl(data);
                    }
                    //FIXME: Correcion nucleo mapea: enviar scope
                }, this);
            }
            this.map = null;
        };
        // FIN ELIMINAR CAPA OSM
        // ******************************

        // ******************************
        // GESTION LEYENDA LAYERS
        // Almacenar ulr de la leyenda
        // @OVERRIDE
        M.impl.Layer.prototype.getLegendURL = function () {
            //Si no tiene valor establecer img leyenda por defecto
            if (M.utils.isNullOrEmpty(this.legendUrl_))
                this.legendUrl_ = M.utils.concatUrlPaths([M.config.THEME_URL, M.Layer.LEGEND_DEFAULT]);
            return this.legendUrl_;
        };
        // @OVERRIDE
        M.impl.Layer.prototype.setLegendURL = function (legendUrl) {
            this.legendUrl_ = legendUrl;
        };
        // FIN GESTION LEYENDA LAYERS
        // ******************************

        // ************************************************************
        // INDICES DE ORDENACION DEFINIDOS POR DEFECTO
        // El orden ya no se establece de manera estandar por mapea si no por la visualizacion en la pantalla
        // @OVERRIDE
        M.impl.Map.Z_INDEX = {};
        M.impl.Map.Z_INDEX[M.layer.type.WMC] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.WMS] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.WMTS] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.Mapbox] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.OSM] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.KML] = 1;
        M.impl.Map.Z_INDEX[M.layer.type.WFS] = 1;
    }
}





