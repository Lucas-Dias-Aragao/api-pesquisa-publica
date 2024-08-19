import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

let processaArquivos;

if (isMainThread) {
  function geraBytesPDF(caminhoArquivo) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { caminhoArquivo },
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', codigo => {
        if (codigo !== 0) {
          reject(new Error(`Worker parou, erro: ${codigo}`));
        }
      });
    });
  }

  processaArquivos = async function(caminhosArquivos) {
    const promessas = caminhosArquivos.map(geraBytesPDF);
    const resultados = await Promise.all(promessas);
    return resultados;
  };
  
} else {
  const { caminhoArquivo } = workerData;

  (async() => {
    try {
      const pdfBytes = fs.readFileSync(caminhoArquivo);
      const documentoPDF = await PDFDocument.load(pdfBytes);

      const bytesPDF = await documentoPDF.save();

      zlib.gzip(bytesPDF, { level: zlib.constants.Z_BEST_COMPRESSION }, (erro, comprimido) => {
        if (erro) {
          parentPort.postMessage({ erro: erro.message });
        } else {
          parentPort.postMessage({ sucesso: true, bytesPDF: comprimido });
        }
      });
    } catch (erro) {
      parentPort.postMessage({ erro: erro.message });
    }
  })();
}

export { processaArquivos };
