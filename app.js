import bot from '@bot-whatsapp/bot';
import 'dotenv/config';

import QRPortalWeb from '@bot-whatsapp/portal';
import BaileysProvider from '@bot-whatsapp/provider/baileys';
import JsonFileAdapter from '@bot-whatsapp/database/json';

//import chatgpt from './services/chatgpt.js';
import GoogleSheetService from './services/sheets.js';

const googleSheet = new GoogleSheetService(
	'1LxvvgsVUBGeTKILyQSvyvt9o8iO97eZLPP1B47qsca8'
);

const GLOBAL_STATE = [];

//******************|Flujo principal|************************//
const flowPrincipal = bot
	.addKeyword(['hola,', 'hola', 'buenas', 'que tal'])
	.addAction(async (_, { flowDynamic }) => {
		return await flowDynamic(
			'Hola bienvenido al servicio de información de Suites LDU de KREAR-T. ¿Cuál es su nombre?'
		);
	})
	.addAction({ capture: true }, async (ctx, { flowDynamic, state }) => {
		await state.update({ nombre: ctx.body });
		return await flowDynamic(`Bienvenido ${ctx.body}`);
	})
	.addAnswer(
		`Disponemos de las siguientes Suites`,
		null,
		async (_, { flowDynamic }) => {
			const getSuites = await googleSheet.getSuitesNames();

			for (const suite of getSuites) {
				GLOBAL_STATE.push(suite);
				await flowDynamic(suite);
			}
		}
	)
	.addAnswer([
		'¿Le interesa alguna? (Escoge una opción)',
		'*Si* me interesa',
		'*No* muchas gracias',
	]);
//***********************************************************//

const flowPedido = bot
	.addKeyword(['Si,', 'Si'], { sensitive: true })
	.addAction(async (_, { flowDynamic }) => {
		return await flowDynamic(
			'Coloque por favor la opción de suite en la que está interesado(a)'
		);
	})
	.addAction({ capture: true }, async (ctx, { state }) => {
		await state.update({ opcion: ctx.body });
	})
	.addAction(
		async (ctx, { flowDynamic, state }) => {
			const currentState = state.getMyState();
			await googleSheet.saveOrder({
				fecha: new Date().toDateString(),
				telefono: ctx.from,
				nombre: currentState.nombre,
				pedido: currentState.opcion,
			});

			return await flowDynamic(
				'Muchas gracias por responder, un asesor se pondrá en contacto con usted lo más pronto posible'
			);
		},

		async (_, { endFlow }) => {
			return endFlow();
		}
	);

const flowFinal = bot
	.addKeyword(['No,', 'No'], { sensitive: true })
	.addAnswer(
		'Entendido, muchas gracias por su tiempo',
		async (_, { endFlow }) => {
			return endFlow();
		}
	);

const main = async () => {
	const adapterDB = new JsonFileAdapter();
	const adapterFlow = bot.createFlow([flowPrincipal, flowPedido, flowFinal]);
	const adapterProvider = bot.createProvider(BaileysProvider);

	bot.createBot({
		flow: adapterFlow,
		provider: adapterProvider,
		database: adapterDB,
	});

	QRPortalWeb();
};

main();
