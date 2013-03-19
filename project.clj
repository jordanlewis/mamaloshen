(defproject mamaloshen "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://mamaloshen.herokuapp.com"
  :license {:name "FIXmE: choose"
            :url "http://example.com/FIXME"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.1.1"]
                 [lein-ring "0.7.0"]
                 [ring/ring-jetty-adapter "1.1.0"]
                 [ring/ring-devel "1.1.0"]
                 [ring-basic-authentication "1.0.1"]
                 [environ "0.2.1"]
                 [com.cemerick/drawbridge "0.0.6"]
                 [org.clojure/java.jdbc "0.2.3"]
                 [korma "0.3.0-beta7"]
                 [postgresql "9.1-901.jdbc4"]]
  :plugins [
            [environ/environ.lein "0.2.1"]
            ;[lein-cljsbuild "0.3.0"]  ;why? https://gist.github.com/sduckett/3019801
            [lein-cljsbuild "0.2.1"]]
  :cljsbuild {
              :builds [{:source-paths ["src-cljs/content.cljs"]
                        :compiler {:output-to "chrome-ext/js/content.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}
                       {:source-paths ["src-cljs/popup.cljs"]
                        :compiler {:output-to "chrome-ext/js/popup.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}
                       ]}
  :min-lein-version "2.0.0"
  :hooks [environ.leiningen.hooks]
  :profiles {:production {:env {:production true}}})
