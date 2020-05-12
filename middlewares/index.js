import { Database, Session } from '../libs/mongoose';

const cors = ({ req, res }) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return ({ req, res });
};

/**
 * Middleware to send Json responses, sets the content-type, then ends the connection.
 *
 * @param req
 * @param res
 */
const jsonResponse = ({ req, res }) => {
  res.json = (data) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  return ({ req, res });
};

const middlewares = [Database, Session, cors, jsonResponse];

const runMiddlewares = async (_middlewares, count, reqRes) => {
  if (count === 0) return _middlewares[0](reqRes);
  return _middlewares[count](await runMiddlewares(_middlewares, count - 1, reqRes));
};

const Middleware = (...rest) => async (req, res) => {
  // loop through middlewares
  const functions = middlewares.concat(rest);
  for (let i = 0; i < functions.length; i += 1) {
    if (typeof functions[i] !== 'function') throw new Error(`${functions[i].toString()} is not a function`);
  }

  try {
    await runMiddlewares(functions, functions.length - 1, { req, res });
  } catch (e) {
    // todo: add logger here
    // eslint-disable-next-line no-console
    console.error(e);
    res.statusCode = e.status || 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(e));
  }

  // avoid stalling requests, when there's no return in handler
  if (!res.headersSent) {
    res.statusCode = 404;
    return res.end('Resource Not Found');
  }

  return null;
};

export default Middleware;
