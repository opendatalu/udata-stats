import { fetchThrottle } from './utils.js'
import dotenv from 'dotenv'

// This script gives all the activity log of an organization as CSV
// Example:  node org-history.js 61a4c3a62867f33a3e80d87f // where the first parameter is the ID of a given organisation on the open data portal

dotenv.config()

async function main() {
    // FIXME: warning, the pagination is not managed...

    const org = process.argv[2]

    // get the activity for an organization
    const response = await fetchThrottle(`${process.env.API}/activity?page=1&page_size=1000&organization=${org}`);
    const data = await response.json();
    let activities = data['data']

    // CSV output
    console.log('date ; object name;  object url ; action; first name ; last name; user url')
    for (const activity of activities) {
        console.log(activity['created_at']+';'+activity['related_to']+';'+activity['related_to_url']+';'+activity['key']+';'+activity['actor']['first_name']+';'+activity['actor']['last_name']+';'+activity['actor']['page'])
    }
}
main().then(() => {}).catch(e => {console.error(e)})