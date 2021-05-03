

module.exports = function () {
    this.run = function () {

        const { google } = require('googleapis');
        this.google = google;
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
        this.client = client;
    }

    /*
        async function gsrun(cl) {
            const gsapi = google.sheets({ version: "v4", auth: cl });
            const opt = {
                spreadsheetId: '1jFhyW3Mh1TGsw0sUuraNGCHTiOGuuu75R5yfXjbJBH0',
                range: 'Individual!A1:K13'
            }
            recentData = await gsapi.spreadsheets.values.get(opt);
            console.log(recentData.data.values);
            let newDataArray = recentData.data.values.map(function (r) {
                r.push(r[0] + "-" + r[1]);
                return r;
            })
            const updateOptions = {
                spreadsheetId: '1jFhyW3Mh1TGsw0sUuraNGCHTiOGuuu75R5yfXjbJBH0',
                range: 'Individual!A1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: newDataArray }
            }
            gsapi.spreadsheets.values.update(updateOptions)
        }
        
        function retrieveData() {
            gsrun(client);
        }
    */
    this.write = async function (cl, file, pos, data) {
        const gsapi = this.google.sheets({ version: "v4", auth: cl });
        const updateOptions = {
            spreadsheetId: '1jFhyW3Mh1TGsw0sUuraNGCHTiOGuuu75R5yfXjbJBH0',
            range: `${file}!${pos}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: data }
        }
        gsapi.spreadsheets.values.update(updateOptions);
    }

    //retrieveData();
    this.writeData = function (file, pos, data) {
        this.write(this.client, file, pos, data);
    }
}