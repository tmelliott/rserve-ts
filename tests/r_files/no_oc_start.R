PORT <- "8881"

cat("Starting normal Rserve on port", PORT, "...\n\n")
Rserve::run.Rserve(
    websockets.port = PORT,
    websockets = TRUE,
    oob = TRUE,
    http.port = "8880"
)
