var get = SC.get, set = SC.set, getPath = SC.getPath;

module("DS.ModelArray");

var array = [{ id: 1, name: "Scumbag Dale" }, { id: 2, name: "Scumbag Katz" }, { id: 3, name: "Scumbag Bryn" }];

module("DS.Store", {
  teardown: function() {
    set(DS, 'defaultStore', null);
  }
});

test("a model array is backed by models", function() {
  var Person = DS.Model.extend();

  var store = DS.Store.create({ adapter: null });
  store.loadMany(Person, [1,2,3], array);

  var modelArray = store.find(Person, [1,2,3]);

  for (var i=0, l=get(array, 'length'); i<l; i++) {
    equals(get(modelArray.objectAt(i), 'data'), array[i], "a model array materializes objects on demand");
  }
});

test("a model is moved from a model array when it is deleted", function() {
  var Person = DS.Model.extend();

  var store = DS.Store.create({ adapter: null });
  store.loadMany(Person, [1,2,3], array);

  var scumbag = store.find(Person, 1);

  var modelArray = store.find(Person, [1, 2, 3]);
  equal(get(modelArray, 'length'), 3, "precond - model array has three items");
  equal(get(modelArray.objectAt(0), 'name'), "Scumbag Dale", "item at index 0 is model with id 1");

  scumbag.deleteModel();

  equal(get(modelArray, 'length'), 2, "model is removed from the model array");
  ok(get(modelArray.objectAt(0), 'name') !== "Scumbag Dale", "item was removed");
});

test("a model array can have a filter on it", function() {
  var Person = DS.Model.extend();
  var store = DS.Store.create();

  store.loadMany(Person, array);

  var modelArray = store.filter(Person, function(hash) {
    if (hash.name.match(/Scumbag [KD]/)) { return true; }
  });

  equal(get(modelArray, 'length'), 2, "The model Array should have the filtered objects on it");

  store.load(Person, { id: 4, name: "Scumbag Koz" });

  equal(get(modelArray, 'length'), 3, "The model Array should be updated as new items are added to the store");

  store.load(Person, { id: 1, name: "Scumbag Tom" });

  equal(get(modelArray, 'length'), 2, "The model Array should be updated as existing members are updated");
});

test("a filtered model array includes created elements", function() {
  var Person = DS.Model.extend();
  var store = DS.Store.create();

  store.loadMany(Person, array);

  var modelArray = store.filter(Person, function(hash) {
    if (hash.name.match(/Scumbag [KD]/)) { return true; }
  });

  equal(get(modelArray, 'length'), 2, "precond - The model Array should have the filtered objects on it");

  person = store.create(Person, { name: "Scumbag Koz" });

  equal(get(modelArray, 'length'), 3, "The model array has the new object on it");
});

test("a model array returns undefined when asking for a member outside of its content Array's range", function() {
  var Person = DS.Model.extend();
  var store = DS.Store.create();

  store.loadMany(Person, array);

  var modelArray = store.find(Person);

  strictEqual(modelArray.objectAt(20), undefined, "objects outside of the range just return undefined");
});

test("a model Array can update its filter", function() {
  var Person = DS.Model.extend();
  var store = DS.Store.create();

  store.loadMany(Person, array);

  var modelArray = store.filter(Person, function(hash) {
    if (hash.name.match(/Scumbag [KD]/)) { return true; }
  });

  equal(get(modelArray, 'length'), 2, "The model Array should have the filtered objects on it");

  modelArray.set('filterFunction', function(hash) {
    if (hash.name.match(/Katz/)) { return true; }
  });

  equal(get(modelArray, 'length'), 1, "The model Array should have one object on it");

  store.load(Person, 5, { name: "Other Katz" });

  equal(get(modelArray, 'length'), 2, "The model Array now has the new object matching the filter");

  store.load(Person, 6, { name: "Scumbag Demon" });

  equal(get(modelArray, 'length'), 2, "The model Array doesn't have objects matching the old filter");
});

test("an AdapterPopulatedModelArray knows if it's loaded or not", function() {
  expect(2);

  var Person = DS.Model.extend();
  var store = DS.Store.create({
    adapter: {
      findQuery: function(store, type, query, modelArray) {
        stop();

        setTimeout(function() {
          modelArray.load(array);
          equal(get(array, 'isLoaded'), true, "The array is now loaded");
          start();
        }, 100);
      }
    }
  });

  var array = store.find(Person, { page: 1 });

  equal(get(array, 'isLoaded'), false, "The array is not yet loaded");
});
