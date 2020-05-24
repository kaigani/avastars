const AvastarsData = require('./export.json')

const rarityMap = ['Common','Uncommon','Rare','Epic','Legendary']
const traitOdds = [0.6,0.225,0.125,0.0475,0.0025]

//
// RUN IT - - - - - - - - - 
//

let allScores = getAllUBScores(AvastarsData.primes)

// Output to console.  Use 'node avastarsUniqueBy.js >> output.log' to save to a file

allScores.map( (ubScore,i)=>{

    let score = 100+Math.log(Math.pow(ubScore.freq,ubScore.ub)/ubScore.odds)
    let output = ''
    output += `${i}\t${ubScore.gender}_UB${ubScore.ub}\t`
    output += `${ubScore.odds}\t${ubScore.freq}\t${score}\t`
    output += ubScore.path.map(o=>`${o.key}[${o.rank}]`).join(',')
    output += `\t${AvastarsData.owners[i]}`
    console.log(output)
})

console.log('\n\n**** DONE *****\n\n')

// - - - - - - - - - - - - - -

//
// For a given list of Avastars, return a trait lookup table
// { gene: {variation:count, variation:count} }
//

function countTraits(avastars){
    let traitCount = {}
    avastars.map(a=>{
        a.traits.map(t=>{
            let key = `${t.gene}_${t.variation}`
            traitCount[key] = traitCount[key] || 0
            traitCount[key]++
        })
    })
    return traitCount
}

//
// Return a list of all avastars matching
// a key (trait) in the form 'gene_variation'
//

function filterAvastarsByKey(avastars,key){
    return avastars.reduce( (prev,curr)=>{
        let found = curr.traits.reduce( (prev,curr)=>{ return key === `${curr.gene}_${curr.variation}` ? true : prev },false )
        if(found){
            prev.push(curr)
        }
        return prev
    },[])
}

// 
// Recursive function to get UB Score 
// given a list of avastars and a list of traits (for the current Avastar being scored)
//

function getUBScore(avastars,traits,ub=0){
    let left = []

    // filter out 'Backdrop' & 'Bg Color'
    let right = traits.reduce( (prev,curr)=>{ 
        if(curr.gene === 'Backdrop' || curr.gene === 'Bg Color'){
            return prev
        }else{
            prev.push(curr)
            return prev
        }
    },[]) 

    let ubScores = []
    let traitCount = countTraits(avastars)

    while(right.length > 0 && avastars.length > 1){// && ub < 6){ // cut at UB6 depth
        
        // select current trait
        let curr = right.pop()
        let key = `${curr.gene}_${curr.variation}`
        let rank = rarityMap.indexOf(curr.rarity) // 0 - common ... 4 - legendary
        let count = traitCount[key] // don't really need the count except for calculation

        // historical 
        let pick = {key:key,rank:rank,count:count}

            // Odds of drawing this trait - roughly
        let odds = traitOdds[rank]/2 // adjusted for male/female

        // Based on 1 in how many of the trait in this selection
        let freq = 1/count

        let list = filterAvastarsByKey(avastars,key)

        let result = getUBScore(list,left.concat(right),ub+1)
        result.path.unshift(pick)
        result.odds *= odds
        result.freq *= freq
        ubScores.push(result)

        left.push(curr)
    }

    if(ubScores.length === 0){
        // END of RECURSION
        return({ub:ub,path:[],odds:1,freq:1})
    }else{
        return ubScores.reduce( (prev,curr)=>{

            if(prev === null){
                return curr
            }else{
                // Scoring used to rank same level UB ratings
                let prevScore = Math.pow(prev.freq,prev.ub)/prev.odds
                let currScore = Math.pow(curr.freq,curr.ub)/curr.odds
                return (curr.ub < prev.ub || (curr.ub === prev.ub && currScore > prevScore) ) ? curr : prev
            }
        },null)
    }
}

function getAllUBScores(avastars){

    let allScores = []


    for(let i=0; i<avastars.length; i++){
        let avastar = avastars[i]
        let ubScore = getUBScore(avastars,avastar.traits)
        ubScore.gender = avastar.gender
        allScores.push(ubScore)
    }

    return allScores
}