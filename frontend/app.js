const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const exjwt = require("express-jwt");
const morgan = require("morgan");

const app = express();

app.use(morgan("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// инициализация middleware от express-jwt
const jwtMW = exjwt({
  secret: "topsecretkey"
});

// замоканная база данных
// !!! при кажом перезапуске api база массив users будет устанавливаться в это состояние!!
let users = [
  {
    id: 1,
    username: "test",
    password: "123",
    avatar: `https://picsum.photos/1/200/200`,
    about:
      "Я тестовый пользователь номер один. Я никогда не пропадаю между запусками api!"
  },
  {
    id: 2,
    username: "test2",
    avatar: `https://picsum.photos/2/200/200`,
    password: "234",
    about:
      "Я тестовый пользователь номер два. Я так же никогда не пропадаю между запусками api!"
  }
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    user => user.username == username && user.password == password
  );

  if (user) {
    // если пользователь найден в массиве users
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "topsecretkey",
      { expiresIn: 129600 }
    );

    res.json({
      success: true,
      error: null,
      token
    });
  } else {
    res.status(401).json({
      success: false,
      token: null,
      error: "Введите правильные имя пользователя/пароль"
    });
  }
});

app.get("/about", jwtMW, (req, res) => {
  const { id } = req.user;
  const user = users.find(user => user.id == id);
  if (user) {
    const { password, ...info } = user;
    res.json({
      success: true,
      data: info
    });
  } else {
    res.status(400).json({
      success: false,
      error: "Не удалось получить информацию о пользователе"
    });
  }
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const isRegistered = users.some(user => user.username == username);
  if (isRegistered) {
    res.status(400).json({
      success: false,
      error: "Пользователь с таким именем уже зарегистрирован"
    });
    return;
  }
  const id = users.length + 1;
  users.push({
    id,
    username,
    password,
    avatar: `https://picsum.photos/id/${id}/200/200`,
    about: null
  });
  res.json({
    success: true,
    message: "Пользователь успешно зарегестрирован"
  });
});

// erroror handling
app.use((error, req, res, next) => {
  if (error.name === "UnauthorizedError") {
    // если пользователь не авторизован - отправляем ошибку о том что он не авторизован
    res.status(401).json({
      success: false,
      message: "Пользователь не авторизован"
    });
  } else {
    next(error);
  }
});

//дефолтный порт приложения
const PORT = 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line
  console.log(`Сервер с API стартовал по адресу http://localhost:${PORT}`);
});
