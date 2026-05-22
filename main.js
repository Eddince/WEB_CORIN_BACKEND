require('dotenv').config();
const express = require('express');
const supabase = require('./supabaseClient')
const authenticateUser = require('./authMiddleware');
const jwt = require('jsonwebtoken')

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

// Endpoint ping
app.get('/ping', async(req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] PING recibido`);
  res.status(200).json({
    success: true,
    type: 'ACTIVE',
    message: 'Hola Servidor',
    timestamp: timestamp,
    
  });
  
});


//LOGIN
// Endpoint de login (genera JWT)
app.post('/login', authenticateUser, (req, res) => {
  res.json({ token: req.token, user: req.user });
});
// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
};

//


// Endpoint para obtener clientes
app.get('/clientes',verifyToken,  async (req, res) => {
    //acceso protegido
   if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
    //
  try {
    // Consultar todos los registros de la tabla 'clientes'
    const { data, error } = await supabase
      .from('clientes')  // Nombre de tu tabla
      .select('*');     // Selecciona todas las columnas

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Endpoint para buscar un cliente atraves del nombre
//http://localhost:3000/clientes/Eddy

app.get('/clientes/:nombre', async (req, res) => {
  try {
    const cliente_nombre = req.params.nombre; // Obtener ID desde la URL

    // Consultar cliente específico
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('nombre', cliente_nombre)  // Filtra donde 'id' = clienteId
      .single();            // Devuelve un solo objeto (no un array)

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "El nombre no existe" });
  }
});

///////////////////////////////////////////POST
app.post('/clientes', async (req, res) => {
  try {
    const { nombre } = req.body;

    // Validación
    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    // Insertar en Supabase (no necesitas enviar el 'id')
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nombre }])
      .select(); // Retorna el registro creado con su ID

    if (error) throw error;

    res.status(201).json(data[0]); // Devuelve el cliente creado
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//
//////////////////////////////////////////////////PUT
app.put('/clientes/:id', async (req, res) => {
  try {
    const clienteId = req.params.id;
    const { nombre } = req.body;

    // Validaciones
    if (!clienteId) {
      return res.status(400).json({ error: 'Se requiere el ID del cliente' });
    }
    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    // Actualizar en Supabase
    const { data, error } = await supabase
      .from('clientes')
      .update({ nombre })
      .eq('id', clienteId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.status(200).json(data[0]); // Devuelve el cliente actualizado
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//
//////////////////////////////////////////////////////////DELETE
app.delete('/clientes/:nombre', async (req, res) => {
  try {
    const cliente_nombre = req.params.nombre;

    if (!cliente_nombre) {
      return res.status(400).json({ error: 'Se requiere el nombre del cliente' });
    }

    // Eliminar en Supabase
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('nombre', cliente_nombre);

    if (error) throw error;

    res.status(200).json({ message: `Cliente con  ${cliente_nombre} eliminado` });
  } catch (err) {
    res.status(500).json({ error: "Error papa" });
  }
});
//////Por id DELETE
app.delete('/clientes/:id', async (req, res) => {
  try {
    const clienteId = req.params.id;

    if (!clienteId) {
      return res.status(400).json({ error: 'Se requiere el ID del cliente' });
    }

    // Eliminar en Supabase
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteId);

    if (error) throw error;

    res.status(200).json({ message: `Cliente con ID ${clienteId} eliminado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//


// Pruebas del backend con base de datos relacionales
//funciona
app.get('/clients', async (req,res) => {
  const { data, error } = await supabase
      .from('clients')  // Nombre de tu tabla
      .select('*');     // Selecciona todas las columnas

    if (error) throw error;

    res.status(200).json(data);
}
)
//funciona
app.post('/clients', async (req, res) => {

    const { nombre } = req.body;
    const { telefono } = req.body;
    const { fecha_cita } = req.body;


    
    const { data, error } = await supabase
      .from('clients')
      .insert([{ nombre, telefono, fecha_cita},])
      .select(); 

     if (error) throw error;   

    res.status(201).json(data[0]); // Devuelve el cliente creado
  
});
//relacion con contratos  FUNCIONA
app.post('/contratos/:id', async (req, res) => {

    const clienteId = req.params.id;
    const { numero_contrato } = req.body;
    const { tipo_servicio } = req.body;
    const { estado } = req.body;


    
    const { data, error } = await supabase
      .from('contratos')
      .insert([{ client_id: clienteId, numero_contrato, tipo_servicio,estado},])
      .select(); 

     if (error) throw error;   

    res.status(201).json(data[0]); // Devuelve el cliente creado
  
});
//Llamada al cliente con todos sus datos y contratos//FUNCIONA
app.get('/clients_contratos', async (req,res) => {
  const { data, error } = await supabase
      .from('clients')  // Nombre de tu tabla
      .select('*, contratos(*)');     // Selecciona todas las columnas

    if (error) throw error;

    res.status(200).json(data);
}
)

//pruebas con las bases de datos reales
app.get('/customers', async (req,res) => {
  const { data, error } = await supabase
      .from('customers')  // Nombre de tu tabla
      //.select('*, ofertas(*, precios(*)), extras(*,precios(*))');  
      .select('*,ofertas(*,precios(*)),extras(*,precios(*))');    
   

    if (error) throw error;

    const resultado = deepClean(data)

    //res.status(200).json(data);
    res.status(200).json(resultado || {});
}
)
/*app.get('/customers/:id', async (req,res) => {

  const clienteID = req.params.id;
  const { data, error } = await supabase
      .from('customers')  // Nombre de tu tabla
      //.select('*, ofertas(*, precios(*)), extras(*,precios(*))');  
      .select('*,ofertas(*,precios(*)),extras(*,precios(*))')
      .eq('id', clienteID)  // Filtra donde 'id' = clienteId
      .single();            // Devuelve un solo objeto (no un array)


   

    if (error) throw error;

    const resultado = deepClean(data)

    //res.status(200).json(data);
    res.status(200).json(resultado || {});
}
)*/

//facturasss///
//buscar una factura
app.get('/facturas/:cliente_id', async (req, res) => {
  try {
    const clienteID = req.params.cliente_id; // Obtener ID desde la URL

    // Consultar cliente específico
    const { data, error } = await supabase
      .from('facturas')
      .select('cliente_id,datos_factura')
      .eq('cliente_id', clienteID)  // Filtra donde 'id' = clienteId
      .single();            // Devuelve un solo objeto (no un array)

    if (error) {
      console.error(`El id no existe`,clienteID);
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (!data) {
      console.log(`Cliente no encontrado`);
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (data){
    res.status(200).json(data);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] GET/ factura leida del cliente`, clienteID);
    }
  } catch (err) {
    console.error(`El id no existe`,clienteID);
    res.status(500).json({ error: "El nombre no existe" });
  }
});

//***************Agenda**************/
//GET
app.get('/agenda', async (req,res) => {

   try {
  
    const { data, error } = await supabase
      .from('agenda')  // Nombre de tu tabla
      //.select('*, ofertas(*, precios(*)), extras(*,precios(*))');  
      .select('*');    
   

    if (error) {
      console.error('Error en la obtencion de turnos en el calendario ->',error.message);
      return res.status(500).json({ error: `Error en la obtencion de turnos en el calendario -> ${error.message}` });
      
    }

    if (data){
    res.status(200).json(data);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] GET/ turnos OK`);
    }


  } catch(err){

    res.status(500).json;
  }

    
}
)
//POST
app.post('/turno', async (req, res) => {

    const { nombre } = req.body;
    const { telefono } = req.body;
    const { fecha } = req.body;

    // Validación básica de datos
        if (!nombre || !telefono || !fecha) {
            return res.status(400).json({
                success: false,
                type: 'VALIDATION_ERROR',
                message: 'Faltan campos requeridos: nombre, teléfono o fecha'
            });
        }



    
    const { data, error } = await supabase
      .from('agenda')
      .insert([{ nombre, telefono, fecha},])
      .select(); 

     if (error) {
            console.error('Error de Supabase:', error);
            return res.status(400).json({
                success: false,
                type: 'DATABASE_ERROR',
                message: 'Error al crear el turno en la base de datos',
                dbError: error.message
            });
        }   

    res.status(201).json(data[0]); // Devuelve el cliente creado
  
});

//DELETE
app.delete('/turno/:id', async (req, res) => {
  try {
    const turnoId = req.params.id;

    if (!turnoId) {
      return res.status(400).json({ error: 'Se requiere el ID del turno' });
    }

    // 1. Primero verificamos si el turno existe
    const { data: existingTurno, error: fetchError } = await supabase
      .from('agenda')
      .select('id')
      .eq('id', turnoId)
      .single(); // Devuelve un solo registro (o null)

    if (fetchError) {
      console.error('Error al buscar el turno:', fetchError);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al verificar el turno en la base de datos',
        dbError: fetchError.message
      });
    }

    if (!existingTurno) {
      return res.status(404).json({
        success: false,
        type: 'NOT_FOUND',
        message: `No existe un turno con el ID ${turnoId}`
      });
    }

    // 2. Si existe, procedemos a borrarlo
    const { error: deleteError } = await supabase
      .from('agenda')
      .delete()
      .eq('id', turnoId);

    if (deleteError) {
      console.error('Error al borrar el turno:', deleteError);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al borrar el turno',
        dbError: deleteError.message
      });
    }

    // Éxito
    res.status(200).json({ 
      success: true,
      message: `Turno con ID ${turnoId} eliminado correctamente` 
    });

    //res.status(200).json({ message: `Turno con ID ${turnoId} eliminado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//**************Lista de Clientes *****///
//****GET */
app.get('/lista_clientes', async (req,res) => {
  const { data, error } = await supabase
      .from('customers')  // Nombre de tu tabla
      //.select('*, ofertas(*, precios(*)), extras(*,precios(*))');  
      .select('id, nombre, telefono, fecha')
      .order('fecha', { ascending: true }) // Ordenar por fecha
      .order('fecha'); 
      
      
   

    //if (error) throw error;
    if (error) {
      console.error('Error al borrar el turno:', deleteError);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al borrar el turno',
        dbError: deleteError.message
      });
    }

    /*res.status(200).json(data);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] GET/ Lista de clientes OK`);*/
    if (data){
    res.status(200).json(data);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] GET/ Lista de clientes`);
    }
    
}
)

//**POST */
app.post('/lista_clientes', async (req, res) => {

    const { nombre } = req.body;
    const { telefono } = req.body;
    const { fecha } = req.body;
    const { oferta_id } = req.body;

    // Validación básica de datos
        if (!nombre || !telefono || !fecha) {
            return res.status(400).json({
                success: false,
                type: 'VALIDATION_ERROR',
                message: 'Faltan campos requeridos'
            });
        }



    
    const { data, error } = await supabase
      .from('customers')
      .insert([{ nombre, telefono, fecha, oferta_id},])
      .select(); 

     if (error) {
            console.error('Error de Supabase:', error);
            return res.status(400).json({
                success: false,
                type: 'DATABASE_ERROR',
                message: 'Error al crear cliente',
                dbError: error.message
            });
        }   

    res.status(201).json(data[0]); // Devuelve el cliente creado
  
});

//

//**POST EXTRASSS */
app.get('/extras/:cliente_id', async (req,res) => {
  const clienteID = req.params.cliente_id; // Obtener ID desde la URL

    // Consultar cliente específico
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('cliente_id', clienteID)  // Filtra donde 'id' = clienteId
      //.single();   
   

    if (error) throw error;

    res.status(200).json(data);
    
}
)

app.post('/extras', async (req, res) => {

    const { cliente_id } = req.body;
    const { extra_id } = req.body;
    const { cantidad} = req.body;
    

    // Validación básica de datos
        if (!cliente_id || !extra_id || !cantidad) {
            return res.status(400).json({
                success: false,
                type: 'VALIDATION_ERROR',
                message: 'Faltan campos requeridos'
            });
        }



    
    const { data, error } = await supabase
      .from('extras')
      .insert([{ cliente_id, extra_id, cantidad},])
      .select(); 

     if (error) {
            console.error('Error de Supabase:', error);
            return res.status(400).json({
                success: false,
                type: 'DATABASE_ERROR',
                message: 'Error al crear cliente',
                dbError: error.message
            });
        }   

    res.status(201).json(data[0]); // Devuelve el cliente creado
  
});

//
//**GET Y POST PARA CREAR FACTURAS */
app.get('/customers/:id', async (req,res) => {

  const clienteID = req.params.id;
  const { data, error } = await supabase
      .from('customers')  // Nombre de tu tabla
      //.select('*, ofertas(*, precios(*)), extras(*,precios(*))');  
      .select('*,ofertas(*,precios(*)),extras(*,precios(*))')
      .eq('id', clienteID)  // Filtra donde 'id' = clienteId
      .single();            // Devuelve un solo objeto (no un array)


   

    if (error) throw error;

    const resultado = deepClean(data)

    //res.status(200).json(data);
    res.status(200).json(resultado || {});
}
)

///ENDPOINT PARA FACTURAS//
app.post('/facturas', async (req, res) => {
  try {
    const { cliente_id } = req.body; // Recibimos el ID del cliente
    
    // 1. Primero obtenemos los datos completos del cliente
    const clienteResponse = await supabase
      .from('customers')
      .select('*, ofertas(*, precios(*)), extras(*, precios(*))')
      .eq('id', cliente_id)
      .single();

    if (clienteResponse.error) {
      throw clienteResponse.error;
    }

    // 2. Limpiamos los datos si es necesario
    const datosCliente = deepClean(clienteResponse.data);

    // 3. Preparamos los datos para la factura
    const facturaData = {
      datos_factura: datosCliente, // Guardamos todo el JSON completo
      cliente_id: cliente_id,
      
      
    };

    // 4. Insertamos en la tabla facturas
    const { data: facturaCreada, error: facturaError } = await supabase
      .from('facturas')
      .insert(facturaData)
      .select()
      .single();

    if (facturaError) {
      throw facturaError;
    }

    // 5. Respondemos con la factura creada
    res.status(201).json(facturaCreada);

  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: error.message });
  }
});

//DELETEEEEE CLIENTE///////
app.delete('/cliente/:id', verifyToken, async (req, res) => {
  const timestamp = new Date().toISOString();
  if (req.user.rol !== 'admin') {
    console.log(`[${timestamp}]DELETE/ Cliente ERROR: Acceso no autorizado`);
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  try {
    const clienteID = req.params.id;

    if (!clienteID) {
      return res.status(400).json({ error: 'Se requiere el ID del turno' });
    }

    // 1. Primero verificamos si el turno existe
    const { data: existing_cliente, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', clienteID)
      .single(); // Devuelve un solo registro (o null)

    if (fetchError) {
      console.error('Error al buscar el turno:', fetchError);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al verificar el cliente en la base de datos',
        dbError: fetchError.message
      });
    }

    if (!existing_cliente) {
      return res.status(404).json({
        success: false,
        type: 'NOT_FOUND',
        message: `No existe un turno con el ID ${turnoId}`
      });
    }

    // Borrado en customers
    const { error: deleteError_1 } = await supabase
      .from('customers')
      .delete()
      .eq('id', clienteID);

    

    if (deleteError_1) {
      console.error('Error al borrar el cliente en la tabla de customers:', deleteError_1);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al borrar el cliente en tabla de customers',
        dbError: deleteError_1.message
      });
    }

    //borrado en facturas
    const { error: deleteError_3 } = await supabase
      .from('facturas')
      .delete()
      .eq('cliente_id', clienteID);

    if (deleteError_3) {
      console.error('Error al borrar el cliente en la tabla de facturas:', deleteError_3);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al borrar el cliente en tabla de facturas',
        dbError: deleteError_3.message
      });
    }

    //borrado en extras    
    const { error: deleteError_2 } = await supabase
      .from('extras')
      .delete()
      .eq('cliente_id', clienteID);

    if (deleteError_2) {
      console.error('Error al borrar el cliente en la tabla de extras:', deleteError_2);
      return res.status(500).json({
        success: false,
        type: 'DATABASE_ERROR',
        message: 'Error al borrar el cliente en tabla de extras',
        dbError: deleteError_2.message
      });
    }

    



    // Éxito
    res.status(200).json({ 
      success: true,
      message: `Cliente con ID ${clienteID} eliminado correctamente` 
    });
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DELETE/ Cliente OK`);

    //res.status(200).json({ message: `Turno con ID ${turnoId} eliminado` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//**EDICIONNNNNNNNNN */
// GET /precios - Obtener todos los precios
app.get('/precios', verifyToken , async (req, res) => {
  const timestamp = new Date().toISOString();
  if (req.user.rol !== 'admin') {
    console.log(`[${timestamp}]GET/ Precios ERROR: Acceso no autorizado`);
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
    try {
        const { data, error } = await supabase
            .from('precios')
            .select('*')
            .order('oferta_id', { ascending: true }) // Ofertas primero
            .order('oferta_id');
        
        if (error) throw error;
        if (data){
    res.status(200).json(data);
    
    console.log(`[${timestamp}] GET/ PRECIOS`);
    }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /precios - Actualizar precios
app.put('/precios',verifyToken, async (req, res) => {
  if (req.user.rol !== 'admin') {
    console.log(`[${timestamp}]PUT/ Precios ERROR: Acceso no autorizado`);
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
    try {
        const { cambios } = req.body;
        
        // Asegurarnos que siempre trabajamos con un array
        const cambiosArray = Array.isArray(cambios) ? cambios : [cambios];
        
        // Validar que tenemos datos para actualizar
        if (!cambiosArray || cambiosArray.length === 0) {
            return res.status(400).json({ error: "No se proporcionaron datos para actualizar" });
        }

        // Actualizar cada precio modificado
        for (const cambio of cambiosArray) {
            const { id, nombre_producto, ...updates } = cambio;
            
            // Validación básica de campos requeridos
            if (!id || !nombre_producto) {
                console.warn('Campos requeridos faltantes en:', cambio);
                continue; // Saltar este elemento
            }

            const { error } = await supabase
                .from('precios')
                .update(updates)
                .eq('id', id)
                .eq('nombre_producto', nombre_producto);
                
            if (error) throw error;
            else{
             console.log(`${cambiosArray.length} registros actualizados:${cambio.nombre_producto} `)
            }
        }
        
        res.json({ 
            success: true,
            message: `${cambiosArray.length} registros actualizados`
        });

    } catch (error) {
        console.error('Error en PUT /precios:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.details || 'Error al actualizar precios' 
        });
    }
});



///*//


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${PORT}`);
});

// Funcion para limpieza de nulls
    const deepClean = (obj) => {
      if (obj === null || obj === undefined) return undefined;
      
      if (Array.isArray(obj)) {
        const cleaned = obj.map(deepClean).filter(item => item !== undefined);
        return cleaned.length > 0 ? cleaned : undefined;
      }
      
      if (typeof obj === 'object') {
        const cleaned = Object.entries(obj).reduce((acc, [key, value]) => {
          const cleanedValue = deepClean(value);
          if (cleanedValue !== undefined) {
            acc[key] = cleanedValue;
          }
          return acc;
        }, {});
        
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }
      
      return obj;
    };

//

