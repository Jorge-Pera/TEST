const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo')
const path = require("path")
const fs = require("fs")
const { start } = require('repl')

/**
 * Declaramos las conexiones de Mongo
 */

const MONGO_DB_URI = 'mongodb://0.0.0.0:27017'
const MONGO_DB_NAME = 'db_bot'


// FUNCION PARA SALIR DEL BOT 
const checkExitCommand = async (ctx, { gotoFlow }) => {
    if (ctx.body.toLowerCase === "salir") {
        return gotoFlow(flowDespedida); 
    }
};

// ()FLOW DE BIENVENIDA, SOLICITUD DE DATOS 👍
const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer("Hola👋, te estas comunicando a la mesa de servicio de la plataforma SCP.")
    .addAnswer("Bienvenido. Por favor, proporciona los siguientes datos (*En un solo mensaje de texto*): \n- Nombre completo \n- Número de dispositivo \n- Cargo \n- Agrupación.", 
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            // Remover espacios adicionales y dividir el texto en líneas o por comas
            let inputData = ctx.body.trim().replace(/\s+/g, " ").split(/\n|,\s*/);
            // Validar si hay al menos 4 elementos
            if (inputData.length >= 4) {
                const [nombreCompleto, numeroDispositivo, cargo, agrupacion] = inputData;
                // Validar que el nombre completo contenga al menos dos palabras (un nombre y un apellido)
                const nombreSplit = nombreCompleto.trim().split(" ");
                // Verificar que haya al menos dos partes en el nombre completo, y que los otros datos estén presentes
                if (nombreSplit.length >= 2 && numeroDispositivo && cargo && agrupacion) {
                    // Aquí puedes agregar cualquier validación adicional de formato, si es necesario
                    return gotoFlow(flowDesicion); // Avanza al siguiente flujo
                }
            }
                return gotoFlow(flowValidacion); // Reintentar capturar los datos
        });

// FLOW VALIDACION DE DATOS 
const flowValidacion = addKeyword(EVENTS.ACTION)
.addAnswer("Faltan datos o el formato es incorrecto. Por favor, ingresa todos los datos requeridos correctamente", 
    { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
        
        // Remover espacios adicionales y dividir el texto en líneas o por comas
        let inputData = ctx.body.trim().replace(/\s+/g, " ").split(/\n|,\s*/);
        
        // Validar si hay al menos 4 elementos
        if (inputData.length >= 4) {
            const [nombreCompleto, numeroDispositivo, cargo, agrupacion] = inputData;
            
            // Validar que el nombre completo contenga al menos dos palabras (un nombre y un apellido)
            const nombreSplit = nombreCompleto.trim().split(" ");
            
            // Verificar que haya al menos dos partes en el nombre completo, y que los otros datos estén presentes
            if (nombreSplit.length >= 2 && numeroDispositivo && cargo && agrupacion) {
                // Aquí puedes agregar cualquier validación adicional de formato, si es necesario
                return gotoFlow(flowDesicion); // Avanza al siguiente flujo
            }
        }
            return gotoFlow(flowValidacion); // Reintentar capturar los datos
    });

// FLUJO DE PRIMERA DESICION 
const flowDesicion = addKeyword(EVENTS.ACTION)
    .addAnswer("Eliga en donde presenta el problema: \n1. Equipo de computo\n2. Dispositivo movil\n3. Seguimiento de ticket\n4. Otro", 
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
        if (ctx.body.toLowerCase() === "1" || ctx.body.toLowerCase() === "equipo" || ctx.body.toLowerCase()==="comput") {
            return gotoFlow(flowWorkstation);
        } else if (ctx.body.toLowerCase() === "2" || ctx.body.toLowerCase() === "dispositivo" || ctx.body.toLowerCase()==="movil") {
            return gotoFlow(flowPointMovil);
        } else if (ctx.body.toLowerCase() === "3" || ctx.body.toLowerCase() === "seguimiento" || ctx.body.toLowerCase()==="ticket") {
            return gotoFlow(flowSeguimiento);
        } else if (ctx.body==="4" || ctx.body.toLowerCase()==="otro"){
            return gotoFlow(flowOtros);
        } else if(ctx.body.toLowerCase()==="salir"){
            await checkExitCommand(ctx, { gotoFlow }); // PRUEBA DE FUNCION PARA SALIR (SE DEBE METER EN UN ELSE PARA EVITAR UN CICLO)
        } else {
            await flowDynamic("Por favor selecciona una opción válida (1, 2, 3 o 4).");
            return gotoFlow(flowDesicion);
        }
    });

// FLOW DE WORKSTATION 👍
const flowWorkstation = addKeyword(EVENTS.ACTION)
    .addAnswer("¿Cual es el problema que presenta en el equipo de computo?")
    .addAnswer("Especifica el tipo de problema: \n1. Software(*programas o aplicaciones*) \n2. Hardware(*problema fisco*) \n3. Regresar", { capture: true }, async (ctx,{ gotoFlow, flowDynamic }) => {
        if (ctx.body==="1") {
            return gotoFlow(flowMenuWS);
        } else if (ctx.body==="2") {
            return gotoFlow(flowMenuWH);
        } else if (ctx.body === "3"){
            return gotoFlow(flowDesicion);
        } else if(ctx.body==="salir"){
            await checkExitCommand(ctx, { gotoFlow }); 
        } else {
            await flowDynamic("Respuesta no válida. Especifica si el problema es de software(1) o hardware(2).");
            return gotoFlow(flowWorkstation);
        }
    });

// FLOW DE POINTMOVIL 👍
const flowPointMovil = addKeyword(EVENTS.ACTION)
    .addAnswer("¿Cuál es el problema con el dispositivo PointMovil?")
    .addAnswer("Especifica el tipo de problema:\n1. Software(*aplicaciones*)\n2. Hardware(*problema fisico*) \n3. Regresar", { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
        if (ctx.body === "1") {
            return gotoFlow(flowMenuPS);
        } else if (ctx.body === "2") {
            return gotoFlow(flowMenuPH);
        } else if (ctx.body === "3"){
            return gotoFlow(flowDesicion);
        } else {
            await flowDynamic("Respuesta no válida. Especifica si el problema es de software(1) o hardware(2).");
            return gotoFlow(flowPointMovil);
        }
    });

// FLOW DE SEGUIMIENTO 👍
const flowSeguimiento = addKeyword(EVENTS.ACTION)
    .addAnswer("¿Tiene un folio de seguimiento? \n1. Si \n2. No \n3. Regresar", { capture: true }, async (ctx, { gotoFlow,flowDynamic }) => {
        if (ctx.body.toLowerCase().includes("si") || ctx.body==="1") {
            return gotoFlow(flowTicket);
        } else if (ctx.body.toLowerCase().includes("no") || ctx.body==="2") {
            return gotoFlow(flowDespedida);
        } else if (ctx.body.toLowerCase().includes("regresar") || ctx.body==="3"){
            return gotoFlow(flowDesicion);
        } else {
            await flowDynamic("Respuesta inválida. Elige una opción (1,2 o 3).");
            return gotoFlow(flowSeguimiento);
        }
    });

//FLUJO DE VALIDACION DE TICKET
const flowTicket = addKeyword(EVENTS.ACTION)
    .addAnswer("Ingresa el folio de seguimiento (debe ser de 6 dígitos)", 
        { capture: true }, async (ctx, { gotoFlow, flowDynamic}) => {
        const folioValido = /^\d{6}$/; // FORMATO DE VALIDACION DE FOLIO 
        if (folioValido.test(ctx.body)) {
            await flowDynamic("Formato de folio correcto.")
            return gotoFlow(flowDespedida);
        } else {
            await flowDynamic("Error, formato incorrecto. Un folio contiene 6 digitos");
            return gotoFlow(flowTicket);
        }
    });

// FLOW DE PROBLEMAS CON SOFTWARE WORKSTATION
const flowMenuWS = addKeyword(EVENTS.ACTION)
    .addAnswer("Eliga el inconveniente presentado (*Escribe un numero*): \n1. Actualizacion de aplicaciones \n2. Contratiempo con SCP \n3. Solicitud de credenciales \n4. Otro \n5. Regresar",
    { capture: true }, async (ctx, {gotoFlow, flowDynamic}) => {
        if(ctx.body === "1"){
            return gotoFlow(flowEvidencia);
        } else if(ctx.body === "2"){
            return gotoFlow(flowUsuario);
        } else if (ctx.body === "3"){
            return gotoFlow(flowAccesos);
        } else if (ctx.body === "4"){
            return gotoFlow(flowOtros)
        } else if (ctx.body==="5"){
            return gotoFlow(flowWorkstation);
        } else {
            await flowDynamic("Opción no válida. Elige un número del 1 al 5.");
            return gotoFlow(flowMenuWS);
        }
    });

// FLOW DE SOLICITUD DE USUARIO 
const flowUsuario = addKeyword(EVENTS.ACTION)
    .addAnswer("Ingrese el usuario del equipo de computo", { capture: true}, async (ctx, {gotoFlow}) => {
        return gotoFlow(flowEvidencia);
    });

//FLOW SOLICITUD DE ACCESOS
const flowAccesos = addKeyword(EVENTS.ACTION)
    .addAnswer("Favor de ingresar los siguietes datos: \n- Usuario \n- Numero de equipo de computo \n Ubicacion", {capture: true}, async (ctx, {gotoFlow}) => {
        return gotoFlow(flowDespedida);
    });

// FLOW DE PROBLEMAS CON HARDWARE WORKSTATION 
const flowMenuWH = addKeyword(EVENTS.ACTION)
    .addAnswer("Eliga el detalle presentado (*Escribe un numero*): \n1. Instalacion de equipo de computo \n2. Rehubicacion de equipo de computo \n3. Inconveniente con componentes \n4. Otro \n5. Regresar",
    { capture: true }, async (ctx, {gotoFlow, flowDynamic}) => {
        if (ctx.body === "1"){
            return gotoFlow(flowInstalacion);
        } else if (ctx.body === "2"){
            return gotoFlow(flowRehubicaion);
        } else if (ctx.body === "3"){
            return gotoFlow(flowComponentes);
        } else if(ctx.body === "4"){
            return gotoFlow(flowOtros);
        } else if(ctx.body==="5"){
            return gotoFlow(flowWorkstation);
        } else {
            await flowDynamic("Opción no válida. Elige un número del 1 al 5.");
            return gotoFlow(flowMenuWH);
        }
    });

// FLOW DE INSTALACION 
const flowInstalacion = addKeyword(EVENTS.ACTION)
    .addAnswer("Ingrese el numero de serie y la ubicacion", {capture: true}, async (ctx, {gotoFlow}) => {
        return gotoFlow(flowDespedida)
    });

// FLOW DE INSTALACION 
const flowRehubicaion = addKeyword(EVENTS.ACTION)
    .addAnswer("Ingrese el numero de serie, ubicacion actual y la nueva ubicacion", {capture: true}, async (ctx, {gotoFlow}) => {
        return gotoFlow(flowDespedida)
    });

// FLOW DE COMPONENTES 
const flowComponentes = addKeyword(EVENTS.ACTION)
    .addAnswer("Eliga el componente donde presenta el incoveniente: \n1. Diadema \n2. Cable HDMI \n3. Monitor \n4. Mouse \n5. Teclado \n6. No break \n7. Otro \n8. Regresar",
        {capture: true}, async (ctx, {gotoFlow, flowDynamic}) => {
            const option = ctx.body.trim();
            if (["1","2","3","4","5","6"].includes(option)){
                return gotoFlow(flowDespedida);
            } else if (option === "7"){
                return gotoFlow(flowOtros)
            } else if(ctx.body==="8"){
                return gotoFlow(flowMenuWH);
            } else {
                await flowDynamic("Opción no válida. Elige un número del 1 al 8.");
                return gotoFlow(flowComponentes);
            }
        });

// FLOW MENU POINTMOVIL SOFTWARE.
const flowMenuPS = addKeyword(EVENTS.ACTION)
    .addAnswer("Elige el inconveniente presentado: \n1. Contratiempo con SCP \n2. Contratiempo con PTT \n3. Problema de red \n4. Solicitar frecuencia \n5. Otro \n6. Regresar",
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            const option = ctx.body.trim(); 
            if (["1", "2", "3"].includes(option)) {
                return gotoFlow(flowEvidencia);
            } else if (option === "4") {
                return gotoFlow(flowSoliCanal);
            } else if (option === "5") {
                return gotoFlow(flowOtros);
            } else if (option === "6"){
                return gotoFlow(flowPointMovil);
            } else {
                await flowDynamic("Opción no válida. Elige un número del 1 al 6.");
                return gotoFlow(flowMenuPS);
            }
        });

//FLOW SOLICITUD DE CANAL 👍
const flowSoliCanal = addKeyword(EVENTS.ACTION)
        .addAnswer("Especificar el canal requerido", { capture: true}, async (ctx, {gotoFlow}) => {
            return gotoFlow(flowDespedida)
        });

// FLOW MENU POINTMOVIL HARDWARE.
const flowMenuPH = addKeyword(EVENTS.ACTION)
    .addAnswer("Elige el tipo de problema presentado: \n1. Contratiempo con accesorios \n2. Daño en dispositivo \n3. Robo o extravío \n4. Otro \n5. Regresar",
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            if (ctx.body === "1") {
                return gotoFlow(flowAccesorios);
            } else if (ctx.body === "2") {
                return gotoFlow(flowDanos);
            } else if (ctx.body === "3") { 
                return gotoFlow(flowScript);
            } else if (ctx.body === "4"){
                return gotoFlow(flowOtros);
            } else if (ctx.body === "5"){
                return gotoFlow(flowPointMovil);
            } else {
                await flowDynamic("Opción no válida. Elige un número del 1 al 5.");
                return gotoFlow(flowMenuPH);
            }
        });

//FLOW DE REPORTE DE ROBO MAS SCRIPT
const flowScript = addKeyword(EVENTS.ACTION)
    .addAnswer("Aquí se adjuntará el script necesario.", 
        { media: "https://www.turnerlibros.com/wp-content/uploads/2021/02/ejemplo.pdf" },
        async (ctx, { gotoFlow }) => {
            return gotoFlow(flowDespedida);
        });    

// FLOW MENU DE ACCESORIOS
const flowAccesorios = addKeyword(EVENTS.ACTION)
    .addAnswer("¿En qué accesorio presenta el problema?\n1. Cable USB\n2. Tapas\n3. Baterías\n4. Cargador\n5. Arnés\n6. Otro\n7. Regresar",
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            const option = ctx.body.trim(); 
            if (["1", "2", "3", "4", "5"].includes(option)) {
                return gotoFlow(flowEvidencia); 
            } else if(ctx.body==="6"){
                return gotoFlow(flowOtros);
            } else if(ctx.body==="7"){
                return gotoFlow(flowMenuPH);
            } else {
                await flowDynamic("Ingrese una opción correcta. Elige un número del 1 al 7.");
                return gotoFlow(flowAccesorios);
            }
        });

// FLOW DAÑOS 
const flowDanos = addKeyword(EVENTS.ACTION)
    .addAnswer("Elija una de las siguientes opciones: \n1. Mantenimiento \n2. Daño en la pantalla \n3. Daño en botones \n4. Reparación de engomado \n5. Cambio de mica \n6. Escáner \n7. Otro \n8. Regresar",
        { capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
            const option = ctx.body.trim(); 
            if (["1", "2", "3", "4", "5", "6"].includes(option)) {
                return gotoFlow(flowEvidencia); 
            } else if (option === "7") {;
                return gotoFlow(flowOtros);
            } else if (ctx.body==="8"){
                return gotoFlow(flowMenuPH);
            } else {
                await flowDynamic("Ingrese una opción correcta. Elige un número del 1 al 8.");
                return gotoFlow(flowDanos);
            }
    });

//FLOW OTROS 👍
const flowOtros = addKeyword(EVENTS.ACTION)
    .addAnswer("Favor de especificar", { capture: true}, async (ctx, {gotoFlow}) => {
        return gotoFlow(flowDespedida);
    });

//FLOW SOLICITUD DE EVIDENCIA 
const flowEvidencia = addKeyword(EVENTS.ACTION)
    .addAnswer("Favor de enviar la evidencia", { capture: true }, async (ctx, { gotoFlow }) => {
        return gotoFlow(flowDespedida); 
    });

// FLOW DESPEDIDA
const flowDespedida = addKeyword(EVENTS.ACTION)
    .addAnswer("Gracias, en un momento un agente se comunicará para dar seguimiento.");


const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    })
    const adapterFlow = createFlow([
        flowWelcome, 
        flowDesicion, 
        flowValidacion,
        flowWorkstation, 
        flowPointMovil, 
        flowSeguimiento, 
        flowTicket, 
        flowMenuWS,
        flowUsuario,
        flowAccesos,
        flowMenuWH, 
        flowInstalacion,
        flowRehubicaion,
        flowComponentes,
        flowMenuPS, 
        flowSoliCanal, 
        flowMenuPH, 
        flowScript, 
        flowAccesorios, 
        flowDanos, 
        flowOtros, 
        flowEvidencia, 
        flowDespedida])

    const adapterProvider = createProvider(BaileysProvider)
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    QRPortalWeb()
}
main()
