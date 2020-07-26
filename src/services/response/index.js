export const success = (res, status, entity, msg) => res
  .status(status || 200)
  .json({
    success: true,
    data: entity || [],
    message: msg || "Record(s)",
  });

export const fail = (res, status, msg) => res
  .status(status || 500)
  .json({
    success: false,
    data: [],
    message: msg || "Operation failed!",
  });


export const notFound = (res, msg) => res
  .status(404)
  .json({
    success: false,
    data: [],
    message: msg || "Record not found!",
  });
