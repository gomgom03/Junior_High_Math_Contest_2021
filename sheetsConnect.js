

module.exports = () => {
    const { google } = require('googleapis');
    const keys = require('./keys.json');



    const client = new google.auth.JWT(
        keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/spreadsheets']
    );

    let recentData;

    client.authorize((err, tokens) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log("No errors.")
        }

    });

    async function gsrun(cl) {
        const gsapi = google.sheets({ version: "v4", auth: cl });
        const opt = {
            spreadsheetId: '1jFhyW3Mh1TGsw0sUuraNGCHTiOGuuu75R5yfXjbJBH0',
            range: 'Individual!A1:K13'
        }
        recentData = await gsapi.spreadsheets.values.get(opt);
        console.log(recentData.data.values);
    }

    function retrieveData() {
        gsrun(client);
    }

    retrieveData();
    this.writeData = function () {

    }
}