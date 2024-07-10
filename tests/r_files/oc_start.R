PORT <- "8781"
source("tests/r_files/oc.init.R")

cat("Starting OCAP Rserve on port", PORT, "...\n\n")
Rserve::run.Rserve(
    websockets.port = PORT,
    websockets = TRUE,
    oob = TRUE,
    http.port = "8780",
    qap = FALSE,
    websockets.qap.oc = TRUE
)
