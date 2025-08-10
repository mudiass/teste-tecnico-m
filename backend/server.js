const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const PORT = 3000;
const app = express();


const API_KEY = '36e6a03e'; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ARQUIVO = path.join(__dirname, 'filmes.json');


function lerFilmes() {
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
}

function salvarFilmes(filmes) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(filmes, null, 2));
}


app.get("/filmes", (req, res) => {
    res.json(lerFilmes());
});

app.post("/filmes", async (req, res) => {
    try {
        const filmes = lerFilmes();
        let { titulo, genero, descricao, imagemUrl } = req.body;

       
        if (!titulo || !genero) {
            return res.status(400).json({ error: "Título e gênero são obrigatórios" });
        }

        
        let finalImagem = imagemUrl?.trim() || "";
        if (!finalImagem) {
            const response = await fetch(`http://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${API_KEY}`);
            const data = await response.json();
            if (data.Response !== "False" && data.Poster && data.Poster !== "N/A") {
                finalImagem = data.Poster;
            }
        }

        const novoFilme = {
            id: filmes.length ? filmes[filmes.length - 1].id + 1 : 1,
            titulo: titulo.trim(),
            genero: genero.trim(),
            descricao: descricao?.trim() || "",
            imagemUrl: finalImagem,
            votosPositivos: 0,
            votosNegativos: 0
        };

        filmes.push(novoFilme);
        salvarFilmes(filmes);
        res.status(201).json(novoFilme);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao adicionar filme" });
    }
});

app.post("/filmes/:id/votoPositivo", (req, res) => {
    const filmes = lerFilmes();
    const filme = filmes.find(f => f.id == req.params.id);
    if (!filme) return res.status(404).json({ error: "Filme não encontrado" });
    filme.votosPositivos++;
    salvarFilmes(filmes);
    res.json(filme);
});

app.post("/filmes/:id/votoNegativo", (req, res) => {
    const filmes = lerFilmes();
    const filme = filmes.find(f => f.id == req.params.id);
    if (!filme) return res.status(404).json({ error: "Filme não encontrado" });
    filme.votosNegativos++;
    salvarFilmes(filmes);
    res.json(filme);
});

app.get('/votos/positivos', (req, res) => {
    const filmes = lerFilmes();
    const total = filmes.reduce((acc, f) => acc + f.votosPositivos, 0);
    res.json({ totalPositivos: total });
});

app.get('/votos/negativos', (req, res) => {
    const filmes = lerFilmes();
    const total = filmes.reduce((acc, f) => acc + f.votosNegativos, 0);
    res.json({ totalNegativos: total });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
