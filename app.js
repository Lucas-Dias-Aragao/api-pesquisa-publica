import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processaArquivos } from './retornaBytes.js';

dotenv.config();

const app = express();
const diretorioBase = process.env.DIR_BASE;

const PORT = 3002;

app.use(cors());

function geraLinkDeDownload(host, tipo, nomeArquivo) {
  return `http://${host}/downloads/${tipo}/${nomeArquivo}`;
}

// Busca por tipo
app.get('/busca/:tipo', (req, res) => {
  const { tipo } = req.params;
  const host = req.headers.host;

  if (!tipo) {
    return res.status(400).json({ erro: 'O tipo é obrigatório' });
  }

  const diretorioTipo = path.join(diretorioBase, tipo);

  fs.readdir(diretorioTipo, (erro, arquivos) => {
    if (erro) {
      return res.status(500).json({ erro: 'Erro ao ler o diretório' });
    }

    const resultado = arquivos.map(arquivo => {
      const nomeArquivo = path.basename(arquivo);
      const linkDownload = geraLinkDeDownload(host, tipo, nomeArquivo);

      return {
        nome: nomeArquivo,
        link: linkDownload,
      };
    });

    res.json(resultado);
  });
});

// Rota para download de arquivos
app.get('/downloads/:tipo/:arquivo', (req, res)=>{
  const { tipo, arquivo } = req.params;
  const caminhoArquivo = path.join(diretorioBase, tipo, arquivo);

  res.download(caminhoArquivo, erro =>{
    if (erro) {
      res.status(500).json({ erro: 'Erro ao fazer o download do arquivo' });
    }
  });
});

// Processamento de múltiplos arquivos PDF e geração de bytes
app.get('/bytes/:tipo', async(req, res)=> {
  const { tipo } = req.params;
  const host = req.headers.host;

  if (!tipo) {
    return res.status(400).json({ erro: 'O tipo é obrigatório' });
  }

  const diretorioTipo = path.join(diretorioBase, tipo);

  fs.readdir(diretorioTipo, async(erro, arquivos) => {
    if (erro) {
      return res.status(500).json({ erro: 'Erro ao ler o diretório' });
    }

    try {
      const caminhosArquivos = arquivos.map(arquivo => path.join(diretorioTipo, arquivo));
      //const resultados = await arrBytes.processaArquivos(caminhosArquivos);
      const resultados = await processaArquivos(caminhosArquivos);
      const resultado = resultados.map((resultado, index) => {
        const nomeArquivo = path.basename(caminhosArquivos[index]);
        const linkDownload = geraLinkDeDownload(host, tipo, nomeArquivo);

        if (resultado.sucesso) {
          return {
            nome: nomeArquivo,
            link: linkDownload,
            bytes: Array.from(resultado.bytesPDF),
          };
        } else {
          return {
            nome: nomeArquivo,
            erro: resultado.erro,
          };
        }
      });

      res.json(resultado);
    } catch (erro) {
      console.error('Erro:', erro);
      res.status(500).json({ erro: 'Erro ao processar os arquivos' });
    }
  });
});

// Processamento de um único arquivo PDF e geração de bytes
app.get('/bytes/:tipo/:arquivo', async(req, res) => {
  const { tipo, arquivo } = req.params;

  if (!tipo || !arquivo) {
    return res.status(400).json({ erro: 'Os parâmetros tipo e arquivo são obrigatórios' });
  }

  const caminhoArquivo = path.join(diretorioBase, tipo, arquivo);

  try {
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }

    //const [resultado] = await arrBytes.processaArquivos([caminhoArquivo]);
    const [resultado] = await processaArquivos([caminhoArquivo]);

    if (resultado.sucesso) {
      res.json({
        nome: arquivo,
        bytes: Array.from(resultado.bytesPDF),
      });
    } else {
      res.status(500).json({ erro: resultado.erro });
    }
  } catch (erro) {
    console.error('Erro:', erro);
    res.status(500).json({ erro: 'Erro ao processar o arquivo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`);
});
