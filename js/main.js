/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// TODO: init my[visualization] variables
// let myViz1,
//     myViz2

// load data using promises
let promises = [
    d3.csv("")
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray[0]);

    // TODO: init visualizations
}