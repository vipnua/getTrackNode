const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto');
app.use(express.json());
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  process.setMaxListeners(15);
  app.get('/track/ontrac/:trackingNumber', async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const url = `https://www.packagetrackr.com/track/${trackingNumber}`;
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
      await page.goto(url);
  
      const element = await page.$('.col-xs-8.status-font');
      const html = await page.evaluate(el => el ? el.innerHTML : null, element);
  
      await page.close();
  
      if (html !== null) {
        const data = { 'status': html.replace('&nbsp;', ' ') };
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ error: 'Tracking number not found' });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  app.get('/track/fedex/:trackingNumber', async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const url = `https://www.postnet.com/track-a-package/?carrier=fedex&tracking=${trackingNumber}`;
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const status = $('.hold-me h5').first().text().replace(/\n|\r/g, '').replace(/\s{2,}/g, ' ').trim();
      if (status) {
        const data = { 'Status': status };
        return res.status(200).json(data);
      } else {
        return res.status(404).json({ error: 'Tracking number not found' });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  });

  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.listen(5000, () => {
    // console.log('Server started on port 5000');
  });
  console.log(`Worker ${process.pid} started on port 5000`);
}