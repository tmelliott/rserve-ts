library(Rserve)

wrap.js.fun <- function(s) {
    if (class(s) != "javascript_function") {
        stop("Can only wrap javascript_function s")
    }
    function(...) {
        # print(list(s, ...))
        self.oobMessage(list(s, ...))
    }
}

wrap.r.fun <- Rserve:::ocap

give.first.functions <- function() {
    x <- 3
    javascript.function <- NULL
    naked.javascript.function <- NULL

    c(
        lapply(
            list(
                print_input = function(x) {
                    print(x)
                    x <- capture.output(print(x))
                    paste(x, collapse = "\n")
                },
                add = function(a, b) {
                    a + b
                },
                newItem = function(name, price) {
                    list(name = name, price = price, codes = sample(100, 5))
                },
                randomNumbers = function() rnorm(10),
                # automate this on the R end (S3 classes?)
                sample_num = function(x) sample(x, 1),
                sample_char = function(x) sample(x, 1),
                iris = function() head(iris),
                rng = function() {
                    list(
                        rnorm = wrap.r.fun(rnorm),
                        runif = wrap.r.fun(runif),
                        flip = wrap.r.fun(function() sample(0:1, 1L))
                    )
                },
                longjob = function(updateProgress) {
                    update_progress <- wrap.js.fun(updateProgress)
                    prog <- 0
                    while (prog < 100) {
                        Sys.sleep(0.2)
                        prog <- prog + 5
                        update_progress(prog)
                    }
                    TRUE
                },
                car_lm = function(y, x) {
                    if (!y %in% names(mtcars)) {
                        stop("y must be a column name in mtcars")
                    }
                    if (!x %in% names(mtcars)) {
                        stop("x must be a column name in mtcars")
                    }
                    fit <- eval(parse(
                        text = sprintf("lm(%s ~ %s, data = mtcars)", y, x)
                    ))
                    list(
                        coef = wrap.r.fun(function() as.list(coef(fit))),
                        rsq = wrap.r.fun(function() summary(fit)$r.squared)
                    )
                }
            ),
            wrap.r.fun
        ),
        list(
            tfail = wrap.r.fun(
                function(v) {
                    stop("hammertime")
                }, "tfail"
            ),
            t1 = wrap.r.fun(
                function(v) {
                    cat("UP!\n")
                    x <<- x + v
                    x
                }, "t1"
            ),
            t2 = wrap.r.fun(
                function(v) {
                    cat("DOWN!\n")
                    x <<- x - v
                    x
                }, "t2"
            ),
            t3 = wrap.r.fun(
                function(v) {
                    # print(v)
                    javascript.function <<- wrap.js.fun(v)
                    TRUE
                }, "t3"
            ),
            t4 = wrap.r.fun(
                function(v) {
                    # print(javascript.function)
                    # returns list(fn, args)
                    r <- javascript.function(v)
                    print(r)
                    r
                }, "t4"
            ),
            t5 = wrap.r.fun(
                function(v) {
                    naked.javascript.function <<- v
                    NULL
                }, "t5"
            ),
            t6 = wrap.r.fun(
                function(v) {
                    list(naked.javascript.function, v)
                }, "t6"
            )
        )
    )
}

####################################################################################################
# make.oc turns a function into an object capability accessible from the remote side

# oc.init must return the first capability accessible to the remote side
oc.init <- function() {
    cat("INIT!\n")
    wrap.r.fun(give.first.functions)
}
