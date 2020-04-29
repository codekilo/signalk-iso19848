const stripMiliSeconds = function(date) {
    return date.toISOString().split('.')[0] + "Z"
}
exports.stripMiliSeconds = stripMiliSeconds