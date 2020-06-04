/**
 * @module M/control/ThematicLayersControl
 */
import ManageLayersImplControl from 'impl/managelayerscontrol';
import ManageLayersControl from './managelayerscontrol.js';
import template from 'templates/thematiclayers';

export default class ThematicLayersControl extends ManageLayersControl {


    /**
     * Name to identify this control
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    static get NAME() {
        return 'ThematicLayers';
    }

    /**
     * Name to identify url template
     * @const
     * @type {string}
     * @public
     * @api stable
     */
    static get TEMPLATE() {
        return template;
    }

    /**
     * @classdesc
     * Main constructor of the class. Creates a ThematicLayersControl
     * control
     *
     * @constructor
     * @extends {M.Control}
     * @api stable
     */
    constructor(params, options) {

        // 2. implementation of this control
        let impl = new ManageLayersImplControl(params);

        let opt_ = {
            controlName: ThematicLayersControl.NAME,
            iconClass: 'g-cartografia-medir-area',
            tooltip: 'Capas temáticas'
        };
        // Se annaden los parametros de control a las opciones
        options = M.utils.extend(opt_, options, true);

        super(impl, params, options);


        /**
         * Params of the control
         * @private
         * @type {params}
         */
        this.params_ = params || {};

        this.thematicLayers_ = [];

        //Establecemos configuracion inicial
        this.loadConfigInicial();
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
        if (obj instanceof ThematicLayersControl) {
            equals = (this.name === obj.name);
        }
        return equals;
    }


    render() {
        this.renderPanel();
    }

    renderPanel() {
        let html = M.template.compileSync(ThematicLayersControl.TEMPLATE, {
            //'jsonp' : true,
            'vars': this.getTemplateVariables_()
        });
            this.getControlContainer_().innerHTML = html.innerHTML;

    }

    addEvents(html) {
        let content = html.querySelector(this.getSelectorContainer_());
        content.addEventListener("click", (evt) => this.clickThematicLayer(evt));
    }

    /**
     * Gets the variables of the template to compile
     */
    getTemplateVariables_() {
        let groups = this.params_.groups;
        let templateData = {
            'groups': groups.map(this.parseGroupForTemplate_, this)
        };
        return templateData;
    }

    parseGroupForTemplate_(group, index) {
        //Sobre el grupo establecemos parametros inciales de visualizacion en el toc de capas tematicas
        let configToc = this.getOptionsControlManageLayers(group);
        if (M.utils.isNullOrEmpty(configToc)) {
            configToc = {
                index: index,
                collapsed: true,
                activated: false
            };
            this.setOptionsControlManageLayers(group, configToc);
        }
        return {
            'id': group.id,
            'title': group.title,
            'collapsed': (configToc.collapsed === true),
            'overlays': group.overlays.map(this.parseLayerForTemplate_, this),
            'activated': (configToc.activated === true),
        };
    }
    parseLayerForTemplate_(layer, index) {
        //Nombre(Titulo) capa
        let layerTitle = layer.legend;
        if (M.utils.isNullOrEmpty(layerTitle))
            layerTitle = layer.name;
        if (M.utils.isNullOrEmpty(layerTitle))
            layerTitle = 'Servicio WMS';
        return {
            'id': layer.id,
            'name': layer.name,
            'title': layerTitle,
            'load': (this.isLoadLayer(layer) === true)
        };
    }
    //Proceso eventos
    clickThematicLayer(evt) {
        evt = (evt || window.event);
        if (!M.utils.isNullOrEmpty(evt.target)) {
            let itemTarget = evt.target;
            let id = itemTarget.getAttribute('data-id');
            if (!M.utils.isNullOrEmpty(id)) {
                evt.stopPropagation();
                //Obtener control y opciones del toc del elemento seleccionado
                let ctolContainer = this.getControlContainer_();
                let itemTocOptions = this.getQuerySelectorScapeCSS(ctolContainer, '#optionsTocGroup_', id);

                //Collapse grupo
                if (itemTarget.classList.contains('m-accion-thematiclayers-collapse')) {
                    //Actualizar configuracion estado del toc
                    let group = this.findItemByProperty(this.params_.groups, 'id', id);
                    let configToc = this.getOptionsControlManageLayers(group);
                    configToc.collapsed = !(itemTocOptions.classList.contains('dNone'));
                    //Mostrar/Ocultar grupo
                    itemTarget.classList.toggle('g-cartografia-flecha-abajo2');
                    itemTarget.classList.toggle('g-cartografia-flecha-arriba2');
                    itemTocOptions.classList.toggle('dNone');
                }
                //Annadir/Eliminar todas los elementos del grupo
                else if (itemTarget.classList.contains('m-accion-thematiclayers-load-group')) {
                    //Determinar accion y obtener elementos a procesar
                    let selectorItems = ((itemTarget.classList.contains('g-cartografia-mas2')) ? 'input[type=checkbox]:not(:checked)' : 'input[type=checkbox]:checked');
                    let itemsSelect = itemTocOptions.querySelectorAll(selectorItems);
                    //Realizar operacion para los elementos seleccionados
                    itemsSelect.forEach((item, index) => {
                        item.click();
                    });
                    //Actualizar estado accion de grupo
                    itemTarget.classList.toggle('g-cartografia-mas2');
                    itemTarget.classList.toggle('g-cartografia-cancelar2');
                    itemTarget.title = ((itemTarget.classList.contains('g-cartografia-mas2')) ? 'Añadir todas las capas del grupo' : 'Eliminar todas las capas del grupo');
                    // Se annade a la configuración del grupo si está activo o no, para el caso en que cambiemos de pestanna
                    let group = this.findItemByProperty(this.params_.groups, 'id', id);
                    let configToc = this.getOptionsControlManageLayers(group);
                    configToc.activated = !(itemTarget.classList.contains('g-cartografia-mas2'));
                }
                //Annadir/Eliminar capa
                else if (itemTarget.classList.contains('m-accion-thematiclayers-load')) {
                    //Acaba de cambiar el estado: checked refleja la accion a realizar no el estado actual
                    let layer = this.findItemByProperty(this.thematicLayers_, 'id', id);
                    let isLoad = (!itemTarget.checked);
                    if (isLoad === true)
                        this.removeLayers(layer);
                    else
                        this.addLayers(layer);
                }
            }
        }
    }

    //EStablece la configuracion inicial para el funcionamiento del control
    loadConfigInicial() {
        let groups = this.params_.groups;
        //Procesar configuracion enviada y establecer datos necesarios
        if (M.utils.isNullOrEmpty(groups))
            groups = [];
        if (!M.utils.isArray(groups))
            groups = [groups];
        groups.forEach((group, index) => {
            //Establecer ID de grupo si no tiene
            if (M.utils.isNullOrEmpty(group.id)) {
                group.id = 'grp_thematic_' + index;
                group.index = index;
            }
            //Opcion para gestion de componente managelayers
            if (M.utils.isNullOrEmpty(group.options))
                group.options = {};
            //Titulo
            if (M.utils.isNullOrEmpty(group.title))
                group.title = 'Grupo - ' + index;
            //Capas
            if (M.utils.isNullOrEmpty(group.overlays))
                group.overlays = [];
            group.overlays = this.loadConfigOverlays(group, group.overlays);
            //Actualizar lista de capas tematicas completa
            this.thematicLayers_ = this.thematicLayers_.concat(group.overlays);
        }, this);
        //Actualizar configuracion
        this.params_.groups = groups;
    }
    //Establece configuracion  inicial para las capas del grupo
    loadConfigOverlays(group, overlaysParam) {
        // parses parameters to Array
        if (!M.utils.isArray(overlaysParam))
            overlaysParam = [overlaysParam];
        // gets the parameters as M.Layer objects to add
        let overlays = overlaysParam.map((item, index) => {
            let overlay;
            if (item instanceof M.Layer)
                overlay = item;
            else {
                try {
                    //Si no es un obj Layer: obtener configuracion y creamos objeto
                    let parameter = M.parameter.layer(item);
                    if (!M.utils.isNullOrEmpty(parameter.type))
                        overlay = new M.layer[parameter.type](item);
                    else
                        M.dialog.error('No se ha especificado un tipo válido para la capa');
                } catch (err) {
                    M.dialog.error('El formato de la capa (' + item + ') no se reconoce');
                }
            }
            //Origen de la capa: tematica
            if (M.utils.isNullOrEmpty(overlay.options))
                overlay.options = {};
            overlay.options.isTematica = true;
            overlay.options.origen = 'Tematica';
            //Establecer ID de layer si no tiene
            if (M.utils.isNullOrEmpty(overlay.id))
                overlay.id = 'thematic_' + group.index + '_' + index;

            return overlay;
        });

        return overlays;
    }

}