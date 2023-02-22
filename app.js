const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const request = require('request');
app.get('/track/ontrac/:trackingNumber', async (req, res) => {
    try {
    const {trackingNumber } = req.params;
    const url = `https://www.packagetrackr.com/track/ontrac/${trackingNumber}`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });
    const html = await page.evaluate(() => {
        return document.querySelector('.col-xs-8.status-font').innerHTML;
    });
    await browser.close();
    const data = { 'Delivered on': html.replace('&nbsp;',' ') };
    res.json(data);}
    catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      }
    
});
app.get('/track/fedex/:trackingNumber',async(req,res)=>{
    try {
        const trackingNumber = req.params.trackingNumber;
        const url = `https://www.postnet.com/track-a-package/?carrier=fedex&tracking=${trackingNumber}`;
        request.get(url, (error, response, body) => {
          if (response.statusCode === 404) {
            return res.status(404).json({ error: 'Tracking number not found' });
          }
        });
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2' });
        const html = await page.evaluate(() => {
          return document.querySelector('.hold-me h5').innerHTML;
        });
        await browser.close();
        const data = { 'Delivered on': html.replace('<span>', '').replace('</span>', '').trim().replace(/\n|\r/g, '').replace(/\s{2,}/g, ' ').trim() };
        res.json(data);
      } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      }
})
app.listen(4000, () => {
    console.log('Server started on port 4000');
});
