const noop = () => {};

class TransactionStub {
  executeSql(sql, params, success) {
    const resultSet = {
      rows: {
        length: 0,
        item: () => null,
        raw: () => [],
      },
      rowsAffected: 0,
      insertId: undefined,
    };
    if (typeof success === 'function') success(this, resultSet);
  }
}

class DatabaseStub {
  constructor(name) {
    this._name = name;
  }

  transaction(callback, errorCb, successCb) {
    try {
      callback(new TransactionStub());
      if (typeof successCb === 'function') successCb();
    } catch (e) {
      if (typeof errorCb === 'function') errorCb(e);
    }
    return Promise.resolve();
  }

  readTransaction(callback, errorCb, successCb) {
    return this.transaction(callback, errorCb, successCb);
  }

  executeSql(sql, params, success, error) {
    const resultSet = {
      rows: {
        length: 0,
        item: () => null,
        raw: () => [],
      },
      rowsAffected: 0,
      insertId: undefined,
    };
    if (typeof success === 'function') {
      success(null, resultSet);
    }
    return Promise.resolve([null, resultSet]);
  }

  close(success) {
    if (typeof success === 'function') success();
    return Promise.resolve();
  }
}

const SQLite = {
  openDatabase(nameOrOptions, _version, _description, _size, success, error) {
    const name =
      typeof nameOrOptions === 'string'
        ? nameOrOptions
        : (nameOrOptions && nameOrOptions.name) || 'default';

    const db = new DatabaseStub(name);

    if (typeof success === 'function') success(db);

    return db;
  },

  deleteDatabase(name, success) {
    if (typeof success === 'function') success();
    return Promise.resolve();
  },

  enablePromise(enable) {
    noop(enable);
  },

  DEBUG(enable) {
    noop(enable);
  },
};

export default SQLite;