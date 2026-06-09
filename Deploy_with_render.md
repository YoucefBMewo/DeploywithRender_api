# Réaliser un déploiement continu avec render et une CI
- L'objectif de ce workshop guidé est de mettre en place une CI et une CD sur un projet Node / Vue.js simple
- Nous aurons trois services :
    - Un service de base de données postgresql (géré nativement par render) - Pas de dockerfile nécessaire
    - Un service contenant notre back en node.js avec express pour avoir une simple API - via un dockerfile
    - Un service contenant notre front avec vue.js qui fait un simple appel à notre API - via un dockerfile

## Connexion et mise en place du projet sur Render
- Connectez-vous à render (vous pouvez utiliser un compte github ou gmail, tout sera gratuit) : [https://dashboard.render.com/](https://dashboard.render.com/)
- Créez un nouveau projet, nommez le comme vous voulez. En cliquant sur "Create your first project". Attention, si vous avez déjà un projet avec votre compte render, vous ne pourrez pas en créer un second gratuitement

## Création de la base de données postgres sur Render
- Ajoutez un service à votre projet
- Choisissez un service Postgres
- Remplissez les champs en mettant un nom de service, un nom de base et un nom de user (vous pouvez mettre des données de tests, comme postgres-simple / postgresdb / postgresuser)
- Prenez la version gratuite
- Validez et la base va prendre un peu de temps à se créer

## Créez un projet avec un repo github pour votre backend
- Pensez à mettre un gitignore de Node
- Ici, je pense que vous pouvez gérer les étapes, mais si besoin je vous aiderai
- Clonez le repo en local, ajoutez jest (npm install jest)
- Faites un npm init dans ce dossier
- Pensez à mettre la commande de test dans votre package.json
- Faites un faux test. Dans un dossier __tests__ et un fichier index.spec.js . Exemple : 
```js
describe('simple test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
})
```
- Installez express (npm install express)
- Installez pg (npm install pg)
- Installez dotenv (npm install dotenv)
- Installez cors (npm install cors)
- Voici le code que vous pouvez mettre dans votre fichier index.js
```js
require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
const connectionString = process.env.DATABASE_URL
app.use(cors())

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
})

app.get('/init', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT
      )
    `)
    res.send('Table users créée (si elle n’existait pas déjà)')
        await pool.query(`
      INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Charlie')
    `)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users')
    res.json(result.rows)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

app.listen(port, () => {
  console.log(`Server listening on https://localhost:${port}`)
})
```

## Mise en place de l'intégration continue
- Créer un dossier .github et un sous dossier workflows
- Créer dedans un fichier ci.yml
- Allez chercher le workflow github action dans l'onglet action pour un workflow Node (classique)
- Et copier / coller le contenu dans votre fichier ci.yml

## Mise en place du Dockerfile pour votre backend
- Créer un fichier Dockerfile à la racine de votre projet :
```dockerfile
FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm install

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]
```
- Pensez à faire un git add . && git commit -m "Message" && git push origin main

## Création du service dans render
- Créez un nouveau service dans votre projet sur render
- Choisissez un webservice 
- Bindez votre repo (s'il est privé, il faudra gérer les autorisations via render)
- Choissez via Dockerfile (pour le déploiement) - Ca doit être sélectionné par défaut
- Dans advanced, pensez à mettre auto-deploy After CI check pass
- Ajoutez une variable d'environnement DATABASE_URL qui vise l'url external database url de votre base de données render (disponible dans info de votre DB sur render)
- Normalement, votre service devrait deploy tout seul et tourner à la fin du déploiement.
- Allez sur https://votre-url-onrender.com/init pour initialiser votre table contenant des données
- Sur l'url https://votre-url-onrender.com/users vous devriez y trouver vos différents users

## Mise en place du frontend
- De même, créez un repo pour votre frontend (pensez au .gitignore Node)
- Clonez le repo en local
- Faites un npm create vue@latest
- Pensez à vous déplacer dans le dossier du projet
```sh
   cd simple-front
   npm install
```
- Mettez les options par défaut
- Créer un fichier .env (dans le dossier du projet) et mettez y la variable VITE_API_URL avec pour valeur l'url de votre API (on-render)
- Remplacez le code de src/App.vue par :
```
<script setup>
import { ref, onMounted } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'

const users = ref([])

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users`)
    users.value = await res.json()
  } catch (err) {
    console.error('Erreur API :', err)
  }
})
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>

  <main>
    <TheWelcome />

    <section>
      <h2>Utilisateurs depuis l’API :</h2>
      <ul>
        <li v-for="u in users" :key="u.id">{{ u.name }}</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
```
- Faites un add + commit + push

## Création du service dans render
- Cette fois créez un Static site (sur votre projet render)
- Mettez le nom de votre projet dans ROOT DIRECTORY
- Dans build command mettez npm ci && npm run build
- Dans publish directory, vous pouvez mettre dist (même si c'est pas utilisé c'est la valeur par défaut d'un projet vue avec vite)
- Ajoutez une variable d'environnement VITE_API_URL (mettez bien VITE_ en préfix, sinon c'est pas chargé par render comme c'est static)
- Normalement, quand le site est live, tout devrait fonctionner correctement et vous devriez voir la liste des users apparaître !

## Etape de recherche - Docker compose
- A vous d'essayer de mettre en place un docker-compose.yml pour que le projet tourne en local !
- Vous devez avoir un service pour :
    - Une base de données postgres
    - Un service back
    - Un service front