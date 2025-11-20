const express = require("express");
const fs = require("fs");
const { generateChartHTML } = require("./chartGenerator.js"); // <-- YES, here

const app = express();



// we will get what chart  , array1 and array2 from buttons in frontend and database 
app.get("/chart", (req, res) => {
    const html = generateChartHTML(
        array1,
        array2,
        "bar",
        "chart-name",
        "rgb(0, 255, 255)"
    );

    res.send(html);
});