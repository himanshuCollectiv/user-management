const addChange = (changes, field, oldValue, newValue) => {
  if (newValue !== undefined && newValue !== oldValue) {
    changes[field] = {
      from: oldValue,
      to: newValue,
    };
  }
};

module.exports = { addChange };