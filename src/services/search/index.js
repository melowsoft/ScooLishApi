
/**
 * @description search() performs a search on models using Elasticsearch
 * @author Ikechukwu Kalu
 *
 * @export
 * @param {Mongoose.model} model - the mongoose model to search
 * @param {String} query - the search query
 * @param {Object} [options={}] - takes parameters to define the search. They are listed below with defaults
 * @property {Integer} options.from - the start index for the search
 * @property {Integer} options.size - the maximum number of records to return
 * @property {Integer} options.fuzziness - the fuzziness value for the analyzer
 * @property {Array} options.fields - the model fields to perform the search on
 * @returns
 */
export default function searchModel(model, query, options = {}) {
  options.from = parseInt(options.from, 10);
  options.size = parseInt(options.size, 10);
  const from = (options.from && Number.isSafeInteger(options.from)) ? options.from : 0;
  const size = (options.size && Number.isSafeInteger(options.size)) ? options.size : 20;
  return new Promise((resolve, reject) => model.search(
    { multi_match: { query, fuzziness: options.fuzziness || 1, fields: options.fields || [""] } },
    { from, size },
    (err, results) => {
      if (!err) resolve(results);
      reject(err);
    },
  ));
}

/**
 * @description search() performs a search on models, excluding documents that match the
 * filter properties using Elasticsearch
 * @author Ikechukwu Kalu
 *
 * @export
 * @param {Mongoose.model} model - the mongoose model to search
 * @param {String} query - the search query
 * @param {Object} [filterObj={}] - takes one parameter for the filter. Ex. {approved: "pending"}
 * @param {Object} [options={}] - takes parameters to define the search. They are listed below with defaults
 * @property {Integer} options.from - the start index for the search
 * @property {Integer} options.size - the maximum number of records to return
 * @property {Integer} options.fuzziness - the fuzziness value for the analyzer
 * @property {Array} options.fields - the model fields to perform the search on
 * @returns
 */
export function searchModelWithFilter(model, query, filterObj1 = {}, filterObj2 = {}, options = {}) {
  if (Object.keys(filterObj1).length === 0) throw new Error("Filter object expects some filter parameters");
  const filterField1 = Object.keys(filterObj1)[0];
  const filterTerm1 = filterObj1[filterField1];
  const filterField2 = Object.keys(filterObj2)[0];
  const filterTerm2 = filterObj2[filterField2];
  options.from = parseInt(options.from, 10);
  options.size = parseInt(options.size, 10);

  const from = (options.from && Number.isSafeInteger(options.from)) ? options.from : 0;
  const size = (options.size && Number.isSafeInteger(options.size)) ? options.size : 20;
  return new Promise((resolve, reject) => model.search(
    {
      bool: {
        must: [
          {
            multi_match: { query, fuzziness: options.fuzziness || 1, fields: options.fields || [""] },
          },
        ],
        must_not: [
          {
            multi_match: { query: filterTerm1, fields: [filterField1] },
          },
          {
            multi_match: { query: filterTerm2, fields: [filterField2] },
          },
        ],
      },
    },
    { from, size },
    (err, results) => {
      if (!err) resolve(results);
      reject(err);
    },
  ));
}