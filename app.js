/* Falta:
- todos los try de las peticiones
- verificaciones:
    - que el usuario no envie los campos requeridos solo con espacios en blanco
    - guardar en mayusculas los campos alfanumericos y recordar hacer las verificaciones teniendo en cuenta esto.

*/

/* ========== REQUIRES ========== */
const { throws } = require('assert');
const express = require('express');
const mysql = require('mysql');
const util = require('util');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========== MYSQL ========== */
// Para trabajar con base de datos mysql
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mybooks'
});

conexion.connect((error) => {
    if (error) {
        throw error;
    }

    console.log('Conexion con base de datos mysql establecida');
});

// para trabajar con async/await en la conexion mysql
const utilQuery = util.promisify(conexion.query).bind(conexion);

/* ========== TODAS LAS PETICIONES AL SERVIDOR ========== */
// Orden de las tablas de la base de datos:
// - 1) Categoria
// - 2) Libro
// - 3) Persona

/* ===== 1) CATEGORIA ===== */
// GET para todas las categorias
app.get('/categoria', async (req, res) => {
    try {
        const query = 'SELECT * FROM categoria';

        const respuesta = await utilQuery(query);

        res.status(200).send({ "respuesta": respuesta });
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// GET para solo una categoria
app.get('/categoria/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM categoria WHERE id = ?';

        const respuesta = await utilQuery(query, [req.params.id]);

        if (respuesta.length === 0) {
            throw new Error("Categoria no encontrada");
        }

        res.status(200).send({ "respuesta": respuesta });
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// POST para agregar una categoria
app.post('/categoria', async (req, res) => {
    try {
        if (!req.body.nombre_categoria) {
            throw new Error("Debes enviar un nombre para agregar una categoria!");
        }

        const nombre_categoria = req.body.nombre_categoria.toUpperCase();

        let query = 'SELECT id FROM categoria WHERE id = ?';

        let respuesta = await utilQuery(query, [nombre_categoria]);

        if (respuesta.length > 0) {
            throw new Error("Ese nombre ya existe!");
        }

        query = 'INSERT INTO categoria (nombre_categoria) VALUES (?)';
        respuesta = await utilQuery(query, [nombre_categoria]);
        console.log(respuesta);
        res.status(200).send({ "respuesta": respuesta.insertId, nombre_categoria });
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// DELETE una categoria
app.delete('/categoria/:id', async (req, res) => {
    try {
        /* falta:
            - validar si la categoria existe o no
            - validar si la categoria tiene datos asociados en la tabla LIBROS
         */

        let query = 'DELETE FROM categoria WHERE id = ?';
        let respuesta = await utilQuery(query, [req.params.id]);

        res.status(200).send("La categoria se borro correctamente");
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});

/* ===== 2) LIBRO ===== */
// GET todos los libros
app.get('/libro', async (req, res) => {
    try {

        const query = 'SELECT * FROM libro';

        let respuesta = await utilQuery(query);

        res.status(200).send({ "respuesta": respuesta });

        

    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// GET solo un libro
app.get('/libro/:id', async (req, res) => {
    try {

    const query = 'SELECT * FROM libro WHERE id = ?';

    let respuesta = await utilQuery(query, req.params.id);
    res.status(200).send({ "respuesta": respuesta });



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// POST libro
app.post('/libro', async (req, res) => {
    try {
         if(!req.body.nombre_libro || !req.body.categoria_id){
             throw new Error('Debe enviar correctamente los datos Nombre y Categoría del libro a ingresar');
         }

        const nombre_libro = req.body.nombre_libro.toUpperCase();
        const descripcion = req.body.descripcion.toUpperCase();
        const categoria_bd = req.body.categoria_id;
      
        
      // Validación de libro en BD
        let qy = 'SELECT * FROM libro WHERE nombre_libro = ?';

        let respuesta1 = await utilQuery(qy, [nombre_libro]);
        console.log(respuesta1);
       
        if (respuesta1.length > 0) {
           throw new Error("Ese nombre de libro ya existe!");
        }

       
     // VALIDA QUE NO SE INGRESEN ESPACIOS EN BLANCO EN NOMBRE
        
         if ( /^\s+$/.test(nombre_libro) ) {
            throw new Error("No es posible ingresar solo espacios en blanco en nombre libro");
           
        }

    
    // Validación de categoría para ingresar el libro
        
        let query = 'SELECT * FROM libro WHERE categoria_id = ?';

        let respuesta = await utilQuery(query, [categoria_bd]);
       
        if (respuesta.length == 0) {
           throw new Error("Ese categoría no existe!");
        }
        
    
        // Insertar registro en la BD
        query = 'INSERT INTO libro (nombre_libro, descripcion, categoria_id, persona_prestamo) VALUES (?, ?, ?, ?)';
        respuesta = await utilQuery(query, [nombre_libro, descripcion, categoria_bd, req.body.persona_prestamo]);
       
        res.status(200).send({ "respuesta": respuesta.insertId, nombre_libro });
    

    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// PUT libro
app.put('/libro/:id', async (req, res)=>{
    try {
       // Validación de datos ingresados

       if (!req.body.nombre_libro) {
           throw new Error("No enviaste el nombre del libro");
       }
       
       let query = 'SELECT * FROM libro WHERE nombre_libro = ? AND id <> ?';

       let respuesta = await utilQuery(query, [req.body.nombre_libro, req.params.id]);

       if (respuesta.length > 0) {
           throw new Error("El nombre del libro que queres poner ahora ya existe");
       }

       // Se realiza la actualización de la base de datos
       query = 'UPDATE libro SET nombre_libro = ?, descripcion = ? WHERE id = ?';

       respuesta = await utilQuery(query, [req.body.nombre_libro.toUpperCase(), req.body.descripcion.toUpperCase(), req.params.id]);

       
       // Se realiza la consulta nuevamente para mostrar datos
       const consulta = 'SELECT * FROM libro WHERE id = ?';

       let respuesta1 = await utilQuery(consulta, req.params.id);
       res.status(200).send({ "respuesta": respuesta1 });

    }
    catch(e){
       console.error(e.message);
       res.status(413).send({"Error inesperado": e.message});
   }
});
// PUT libro prestar
app.put('/libro/prestar/:id', async (req, res) => {
    try {
 
       
    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// PUT libro devolver
app.put('/libro/devolver/:id', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// DELETE libro
app.delete('/libro/:id', async (req, res) => {
    try {
     


    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});

/* ===== 3) PERSONA ===== */
// GET personas
app.get('/persona', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// GET una sola persona
app.get('/persona/:id', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// POST persona
app.post('/persona', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// PUT persona
app.put('/persona/:id', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});
// DELETE persona
app.delete('/persona/:id', async (req, res) => {
    try {



    }
    catch (e) {
        console.error(e.message);
        res.status(413).send({ "error": e.message })
    }
});

/* ========== SERVIDOR ========== */
app.listen(port, (req, res) => console.log("Server listening on port " + port));