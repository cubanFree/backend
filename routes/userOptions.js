const route = require('express').Router()
const UserModel = require('../models/userModel')
const { ChatModel, ContactModel, FriendRequest, MessageModel } = require('../models/messageModel')
const bcrypt = require('bcryptjs')

// register
route.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    // Verifica si username y password están presentes en la solicitud
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required!' })
    }

    // Verifica si el usuario ya existe en la base de datos
    const existingUser = await UserModel.findOne({ username })
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists!', flag: false })
    }

    // Cifrado de la contraseña con bcrypt
    // Genera un hash de la contraseña con salt
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crea el nuevo usuario
    const newUser = new UserModel({ username, password: hashedPassword })
    await newUser.save()

    // Crea el nuevo modelo de datos de ese usauario
    const newChat = new ChatModel({
      refUser: newUser._id,
      contacts: [],
      requests: [],
      requestsSends: []
    })

    await newChat.save()

    res.status(201).json({ flag: true })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'User not created!', flag: false })
  }
})

// validate login
route.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Verifica si el nombre de usuario y la contraseña están presentes en la solicitud
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required!', flag: false })
    }

    // Busca al usuario en la base de datos por el nombre de usuario
    const user = await UserModel.findOne({ username })

    if (!user) {
      return res.status(404).json({ message: 'User not found!', flag: false })
    }

    // Compara la contraseña proporcionada con la contraseña almacenada
    const validPassword = await bcrypt.compare(password, user.password)

    if (validPassword) {
      // Si la contraseña es válida, puedes generar un token JWT y enviarlo como respuesta
      // Aquí se utiliza un ejemplo simple, pero debes implementar adecuadamente la generación y manejo del token
      // const token = generateJWT(user._id)

      return res.status(200).json({ flag: true, id: user._id })
    } else {
      return res.status(401).json({ message: 'Incorrect password!', flag: false })
    }
  } catch (err) {
    res.status(500).json({ message: 'Error during login', flag: false })
  }
})

// send message
route.post('/send-message/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { message, usernameContact } = req.body

    if (!id || !message || !usernameContact) return res.status(400).send({ message: 'Not id or message or username-contact!' })

    // get id username and Contact
    const getIdHost = await ChatModel.findOne({ refUser: id })
    const searchContact = await UserModel.findOne({ username: usernameContact })
    const getIdContact = await ChatModel.findOne({ refUser: searchContact._id })

    if (!getIdHost || !getIdContact) {
      return res.status(404).send({ message: 'User not found!' })
    } else {
      try {
        // create message model
        const messageModel = new MessageModel({ content: message, date: new Date() })

        // add message to contact
        const getIndexHost = getIdContact.contacts.findIndex((contact) => contact.id.toString() === id.toString())
        const getIndexContact = getIdHost.contacts.findIndex((contact) => contact.id.toString() === searchContact._id.toString())

        if (getIndexContact === -1 || getIndexHost === -1) return res.status(404).send({ message: 'User not found on your contact!' })

        ChatModel.updateOne(
          { refUser: id },
          { $push: { [`contacts.${getIndexContact}.messageHost`]: messageModel } }
        )
          .then(result => {
            console.log(result)
          })
          .catch(err => {
            console.error(err)
          })

        ChatModel.updateOne(
          { refUser: searchContact._id },
          { $push: { [`contacts.${getIndexHost}.messageGuest`]: messageModel } }
        )
          .then(result => {
            console.log(result)
          })
          .catch(err => {
            console.error(err)
          })

        return res.status(200).send({ message: 'Message sent!' })
      } catch (err) {
        res.status(400).send({ message: 'Error sending message' })
      }
    }
  } catch (err) {
    res.status(400).send({ message: 'Error something went wrong in the propieties' })
  }
})

// get user id logged
route.get('/chat/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).send({ message: 'Id not found!' })
    const user = await UserModel.findById(id)
    return res.status(200).send(user)
  } catch (err) {
    res.status(404).send({ message: err })
  }
})

// get contacts
route.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).send({ message: 'Id not found!' })
    const contacts = await ChatModel.findOne({ refUser: id })
    if (!contacts || !contacts.contacts.length) return res.status(404).send({ message: 'Contacts not found!' })
    return res.status(200).send({ refUser: contacts.refUser, contacts: contacts.contacts })
  } catch (err) {
    res.status(404).send({ message: err })
  }
})

// get friends requests
route.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).send({ message: 'Id not found!' })
    const user = await ChatModel.findOne({ refUser: id })
    return res.status(200).send({ requests: user.requests })
  } catch (err) {
    res.status(404).send({ message: err })
  }
})

// get requests sends
route.get('/requests-sends/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).send({ message: 'Id not found!' })
    const user = await ChatModel.findOne({ refUser: id })
    return res.status(200).send(user.requestsSends)
  } catch (err) {
    res.status(404).send({ message: err })
  }
})

// get username on Data Base for search general
route.get('/search/:username', async (req, res) => {
  try {
    const { username } = req.params
    if (!username) return res.status(400).send({ message: 'Invalid username!' })
    const user = await UserModel.findOne({ username })
    return res.status(200).send({ id: user._id, username: user.username })
  } catch (err) {
    res.status(404).send({ message: 'User not found' })
  }
})

// get chat with contact
route.patch('/open-chat/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { idContact } = req.body
    if (!id) return res.status(400).send({ message: 'Id not found!' })

    // getId Host
    const chat = await ChatModel.findOne({ refUser: id })

    // find contact index
    const getIndexContact = await chat.contacts.findIndex((contact) => contact.id.toString() === idContact)

    // get username of contact
    const getContact = await UserModel.findOne({ _id: idContact })

    if (!chat.contacts[getIndexContact].messageHost && !chat.contacts[getIndexContact].messageGuest) {
      return res.status(404).send({ username: getContact.username, content: [] })
    } else {
      // get messages host and guest
      const messages = []
        .concat(chat.contacts[getIndexContact]?.messageHost?.map(cont => ({ body: cont, from: 'host' })) || [])
        .concat(chat.contacts[getIndexContact]?.messageGuest?.map(cont => ({ body: cont, from: 'guest' })) || [])

      // Función de comparación para ordenar por fechas
      function compararFechas (a, b) {
        const fechaA = new Date(a.body.date)
        const fechaB = new Date(b.body.date)

        // Compara las fechas
        if (fechaA < fechaB) {
          return -1
        } else if (fechaA > fechaB) {
          return 1
        } else {
          return a.body._id.getTimestamp() - b.body._id.getTimestamp()
        }
      }

      // Ordena los mensajes por fecha
      messages.sort(compararFechas)

      return res.status(200).send({ chats: messages, username: getContact.username })
    }
  } catch (err) {
    console.error(err)
    res.status(404).send({ message: 'Error when getting user properties on open-chat' })
  }
})

// adding both to your contacts if Host accept
route.patch('/add-contact/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { idContact } = req.body
    if (!id || !idContact) return res.status(400).send({ message: 'Not id or id-contact!' })

    // getId Host
    const getIdHost = await UserModel.findById(id)
    // getId Contact
    const getIdContact = await UserModel.findById(idContact)

    // get both Models Chats (Host and Contact)
    const getIdHostChat = await ChatModel.findOne({ refUser: id })
    const getIdContactChat = await ChatModel.findOne({ refUser: idContact })

    if (!getIdHost || !getIdContact) return res.status(404).send({ message: 'User not found!' })

    // creating Contact Model
    const contact = new ContactModel({
      id: getIdContact._id,
      username: getIdContact.username,
      messageHost: [],
      messageGuest: []
    })
    const host = new ContactModel({
      id: getIdHost._id,
      username: getIdHost.username,
      messageHost: [],
      messageGuest: []
    })

    // add both
    getIdHostChat.contacts.push(contact)
    getIdContactChat.contacts.push(host)

    // Eliminar el request sends del Contact
    getIdContactChat.requestsSends = getIdContactChat.requestsSends.filter((requestSend) => requestSend.id.toString() !== id.toString())
    // Eliminar el request del Host
    getIdHostChat.requests = getIdHostChat.requests.filter((request) => request.id.toString() !== idContact.toString())

    try {
      // Guardar los cambios en ambos modelos
      await getIdHostChat.save()
      await getIdContactChat.save()
      return res.status(200).send({ message: 'Added for both!' })
    } catch (err) {
      return res.status(400).send({ message: 'Error when adding!' })
    }
  } catch (err) {
    res.status(404).send({ message: 'Error when getting user properties' })
  }
})

// invitation sent by the host
route.patch('/invite/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { idContact } = req.body

    if (!id || !idContact) {
      return res.status(400).send({ message: 'Not id or id-contact!' })
    }

    // get username of Contact
    const getContactId = await UserModel.findById(idContact)
    // get username of Host
    const getUsernameHost = await UserModel.findById(id)

    // adding Contact to Host
    const contactModel = new FriendRequest({ username: getContactId.username, id: idContact })
    // adding Host to Contact
    const hostModel = new FriendRequest({ username: getUsernameHost.username, id })

    // get both models (Contact and Host)
    const getIdHost = await ChatModel.findOne({ refUser: id })
    const getIdContact = await ChatModel.findOne({ refUser: idContact })

    // add both models
    getIdHost.requestsSends.push(contactModel)
    getIdContact.requests.push(hostModel)

    // check if request sent
    try {
      await getIdHost.save()
      await getIdContact.save()
      return res.status(200).send({ message: 'Request sent!' })
    } catch (err) {
      console.error(err)
      return res.status(400).send({ message: 'Error when adding!' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).send({ message: 'Internal Server Error' })
  }
})

// cancel request sent by the Host
route.delete('/cancel-request/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { idContact } = req.body

    if (!id || !idContact) {
      return res.status(400).send({ message: 'Not id or id-contact!' })
    }

    // Obtener el modelo del Host
    const getIdHost = await ChatModel.findOne({ refUser: id })
    // Obtener el modelo del Contacto
    const getIdContact = await ChatModel.findOne({ refUser: idContact })

    if (!getIdHost || !getIdContact) {
      return res.status(404).send({ message: 'Host or contact not found!' })
    }

    // Eliminar el request de contacto enviado por el host
    getIdContact.requests = getIdContact.requests.filter((request) => request.id.toString() !== id.toString())

    // Eliminar el request dends del Host
    getIdHost.requestsSends = getIdHost.requestsSends.filter((request) => request.id.toString() !== idContact.toString())

    try {
      // Guardar los cambios en ambos modelos
      await getIdHost.save()
      await getIdContact.save()
      return res.status(200).send({ message: 'Deleted request!' })
    } catch (err) {
      console.error(err)
      return res.status(500).send({ message: 'Error when saving changes!' })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).send({ message: 'Internal server error!' })
  }
})

// delete request sent by the Contact
route.delete('/delete-request/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { idContact } = req.body

    if (!id || !idContact) {
      return res.status(400).send({ message: 'Not id or id-contact!' })
    }

    // Obtener el modelo del Host
    const getIdHost = await ChatModel.findOne({ refUser: id })
    // Obtener el modelo del Contacto
    const getIdContact = await ChatModel.findOne({ refUser: idContact })

    if (!getIdHost || !getIdContact) {
      return res.status(404).send({ message: 'IdHost or IdContact not found!' })
    }

    // Eliminar el request sends del Contact
    getIdContact.requestsSends = getIdContact.requestsSends.filter((requestSend) => requestSend.id.toString() !== id.toString())

    // Eliminar el request del Host
    getIdHost.requests = getIdHost.requests.filter((request) => request.id.toString() !== idContact.toString())

    try {
      // Guardar los cambios en ambos modelos
      await getIdHost.save()
      await getIdContact.save()
      return res.status(200).send({ message: 'Deleted request!' })
    } catch (err) {
      console.error(err)
      return res.status(500).send({ message: 'Error when saving changes!' })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).send({ message: 'Internal server error!' })
  }
})

// JWT implement
// Función para generar un token JWT (debes implementar esta función según tus necesidades)
// function generateJWT(userId) {
//   // Aquí debes usar una biblioteca como jsonwebtoken para generar un token JWT
//   // Ejemplo simple de generación de token:
//   const jwtPayload = { userId };
//   const secretKey = 'tu_clave_secreta'; // Debes reemplazar esto con una clave secreta real
//   const token = jwt.sign(jwtPayload, secretKey, { expiresIn: '1h' }); // El token expira en 1 hora

//   return token;
// }

module.exports = route
