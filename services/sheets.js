import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SCOPES = [
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/drive.file',
];

class GoogleSheetService {
	// jwtFromEnv = undefined;
	doc = undefined;

	constructor(id) {
		if (!id) {
			throw new Error('ID_UNDEFINED');
		}

		this.jwtFromEnv = new JWT({
			email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			scopes: SCOPES,
		});
		this.doc = new GoogleSpreadsheet(id, this.jwtFromEnv);
	}

	/**
	 * Recuperar el menu del dia
	 * @param {*} dayNumber
	 * @returns
	 */
	getSuitesNames = async () => {
		try {
			const list = [];
			await this.doc.loadInfo();
			const sheet = this.doc.sheetsByIndex[0]; // the first sheet
			await sheet.loadCells('A1:H10');
			const rows = await sheet.getRows();

			for (let index = 0; index <= rows.length - 1; index++) {
				let suiteName = rows[index].get('SUITE');
				let suitePrice = rows[index].get('PRECIO');
				list.push(`${suiteName} con un precio de $ ${suitePrice}`);
			}

			return list;
		} catch (err) {
			console.log(err);
			return undefined;
		}
	};

	getSuitesPrices = async () => {
		try {
			const list = [];
			await this.doc.loadInfo();
		} catch (err) {
			console.log(err);
			return undefined;
		}
	};

	/**
	 * Guardar pedido
	 * @param {*} data
	 */
	saveOrder = async (data = {}) => {
		await this.doc.loadInfo();
		const sheet = this.doc.sheetsByIndex[1]; // the first sheet

		const order = await sheet.addRow({
			fecha: data.fecha,
			telefono: data.telefono,
			nombre: data.nombre,
			pedido: data.pedido,
			observaciones: data.observaciones,
		});

		return order;
	};
}

export default GoogleSheetService;
