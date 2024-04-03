import { fetchThrottle } from './utils.js'
import dotenv from 'dotenv'

dotenv.config()

// Option to count discussions 
// unfortunately the metrics in the API seem to be unreliable, we have to count discussions via the API, and this can be quite time consuming. This option is disabled by default.
const countDiscussions = false

async function getDatasets(idOrg) {
    const response = await fetchThrottle(`${process.env.API}/datasets/?organization=${idOrg}&page=1&page_size=1000`);
    const data = await response.json()
    return data.data
}

async function getReuses(idOrg) {
    const response = await fetchThrottle(`${process.env.API}/reuses/?organization=${idOrg}&page=1&page_size=1000`);
    const data = await response.json()
    return data.data    
}

async function getDiscussions(idDataset) {
    const response = await fetchThrottle(`${process.env.API}/discussions/?sort=-created&for=${idDataset}&page=1&page_size=1000`)
    const data = await response.json()
    return data.data  
}

// for a given array, counts the occurences of every element and gives the result as text
function getFrequencies(arr) {
    const available = [... new Set(arr)]
    return available.map(e => [e, arr.filter(x => x == e).length]).sort((a,b) => b[1]-a[1]).map(e => `${e[0]}: ${e[1]}`).join(', ')    
}

// get infos from the api of the open data portal and generate a csv file
async function main() {

    // get the list of organizations
    const response = await fetchThrottle(`${process.env.API}/organizations/?sort=-datasets&page=1&page_size=1000`);
    const data = await response.json();
    let orgs = data['data']

    // csv header
    console.log('name ; page ; Official ; NR datasets ; NR resources ; NR reuses published by the organisation ; NR members ; Licenses ; Formats' + (countDiscussions?' ; NR Discussions':''))
    // orgs = orgs.filter(e => {return e.badges.length !== 0})
    
    for (const org of orgs) {
        const datasets = (await getDatasets(org.id)).filter(e => e.private === false)
        const resources = datasets.map(e => e.resources.length).reduce((partial, a) => partial+a, 0)
        const reuses = await getReuses(org.id)
        const licenses = datasets.map(e => e.license)
        const formats = datasets.flatMap(e => e.resources).map(e => e.format)
        const infoLicenses = getFrequencies(licenses)
        const infoFormats = getFrequencies(formats)
        const official = org.badges.length !== 0
        let discussionsCount = 0
        if (countDiscussions) {
            for (const ds of datasets) {
                const disc = await getDiscussions(ds.id)
                discussionsCount += disc.length
            }
        }
        const results = [org.name.replace(/;/g,','), org.page, official.toString(), datasets.length, resources, reuses.length, org.members.length, infoLicenses, infoFormats]
        if (countDiscussions) {
            results.push(discussionsCount)
        }
        console.log(results.join(';'))
    }
}

main().then(() => {}).catch(e => {console.error(e)})

