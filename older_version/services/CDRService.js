define("robotTW2/services/CDRService", [
  "robotTW2",
  "robotTW2/time",
  "robotTW2/conf",
  "robotTW2/databases/data_log_cdr",
  "robotTW2/databases/data_cdr",
  "robotTW2/databases/data_villages",
  "helper/format"
], function (
  robotTW2,
  time,
  conf,
  data_log_cdr,
  data_cdr,
  data_villages,
  formatHelper
) {
    return (function CDRService(
      $rootScope,
      socketService,
      providers,
      groupService,
      modelDataService,
      overviewService,
      academyService,
      recruitingService,
      $timeout,
      $filter,
      ready
    ) {
      var isInitialized = !1
        , isRunning = !1
        , isPaused = !1
        , searching = false
        , listener_resume = undefined
        , paused_promise = undefined
        , paused_queue = false
        , promise_rename = undefined
        , promise_rename_queue = []
        , promise_nobles = undefined
        , promise_deposit = undefined
        , queue_nobles = []
        , queue_deposit = false
        , interval = null
        , interval_cicle = null
        , listener_coins = undefined
        , listener_group_updated = undefined
        , listener_group_created = undefined
        , listener_group_destroyed = undefined
        , listener_quest_collect = undefined
        , listener_quest_finished = undefined
        , listener_job_collect = undefined
        , listener_job_rerolled = undefined
        , listener_job_collectible = undefined
        , listener_job_info = undefined
        , min_time = conf.INTERVAL.CDR
        , prices = (function () {
          var unitData = modelDataService.getGameData().getUnits();
          var prices = {};
          unitData.forEach(function (data) {
            var array_price = [];
            array_price.push(data.wood);
            array_price.push(data.clay);
            array_price.push(data.iron);
            array_price.push(data.food);
            prices[data.name] = array_price;
          });
          return prices;
        })()
        , verifyGroups = function () {
          var groups = groupService.getGroups();
          Object.keys(groups).forEach(function (id) {
            if (!data_cdr.groups) { data_cdr.groups = {} }
            if (!data_cdr.groups[id]) {
              data_cdr.groups[id] = groups[id];
            }
          });

          Object.keys(data_cdr.groups).forEach(function (id) {
            if (!groups[id]) {
              delete data_cdr.groups[id];
            }
          });

          data_cdr.set();

          return;
        }
        , RESOURCE_TYPES = modelDataService.getGameData().getResourceTypes()
        , noblesSteps = function (list_nobles, callback) {
          if (!list_nobles.length) {
            if (typeof (callback) == "function") {
              callback()
            }
            return
          }
          list_nobles.forEach(function (village) {
            var sec_promise = function (village) {
              if (!promise_nobles) {
                promise_nobles = new Promise(function (res, rej) {
                  let village_id = village.getId()
                  num_nobles = recruitingService.getMaxTrainableNobles(village).byResources.bound(0, 1);

                  if (num_nobles > 0) {
                    socketService.emit(providers.routeProvider.ACADEMY_RECRUIT, {
                      'village_id': village_id,
                      'unit_type': "snob",
                      'amount': 1
                    });
                    data_log_cdr.logs.push(
                      {
                        "text": $filter("i18n")("noble_recruiting", $rootScope.loc.ale, "cdr") + " " + formatHelper.villageNameWithCoordinates(village.data),
                        "date": time.convertedTime()
                      }
                    )

                    $timeout(function () {
                      res()
                    }, 5000)
                  } else {
                    res()
                  }
                }).then(function () {
                  promise_nobles = undefined
                  if (isPaused) {
                    typeof (listener_resume) == "function" ? listener_resume() : null;
                    listener_resume = undefined
                    listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
                      if (queue_nobles.length) {
                        village_id = queue_nobles.shift()
                        sec_promise(village_id)
                      } else {
                        if (typeof (callback) == "function") {
                          callback()
                        }
                      }
                    })
                  } else {
                    if (queue_nobles.length) {
                      village_id = queue_nobles.shift()
                      sec_promise(village_id)
                    } else {
                      if (typeof (callback) == "function") {
                        callback()
                      }
                    }
                  }

                }, function (data) {
                  promise_nobles = undefined
                  $rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, { message: data.message });
                  if (isPaused) {
                    typeof (listener_resume) == "function" ? listener_resume() : null;
                    listener_resume = undefined
                    listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
                      if (queue_nobles.length) {
                        village_id = queue_nobles.shift()
                        sec_promise(village_id)
                      } else {
                        if (typeof (callback) == "function") {
                          callback()
                        }
                      }
                    })
                  } else {
                    if (queue_nobles.length) {
                      village_id = queue_nobles.shift()
                      sec_promise(village_id)
                    } else {
                      if (typeof (callback) == "function") {
                        callback()
                      }
                    }
                  }
                })
              } else {
                queue_nobles.push(village_id);
              }
            }
            sec_promise(village)
          })

        }
        , coinsSteps = function (list_coins, callback) {
          var villagesMass = [];
          if (!list_coins.length) {
            if (typeof (callback) == "function") {
              callback()
            }
            return
          }

          list_coins.forEach(function (village) {
            let village_id = village.getId()
              , maxCoins = academyService.calculateMaxCoins(village_id);
            data_log_cdr.logs.push(
              {
                "text": $filter("i18n")("minted_coins", $rootScope.loc.ale, "cdr") + " " + maxCoins + " - " + formatHelper.villageNameWithCoordinates(village.data),
                "date": time.convertedTime()
              }
            )
            if (maxCoins > 0) {
              villagesMass.push({
                'id': village_id,
                'amount': maxCoins
              });
            }
          })

          if (!villagesMass.length) { return }

          socketService.emit(providers.routeProvider.MASS_MINT_COINS, {
            'villages': villagesMass
          });

          data_log_cdr.logs.push(
            {
              "text": $filter("i18n")("minted_coins", $rootScope.loc.ale, "cdr"),
              "date": time.convertedTime()
            }
          )

          if (typeof (callback) == "function") {
            callback()
          }

        }
        , wait = function (job) {
          setList(job, function (tm) {
            if (!interval) {
              interval = $timeout(getInfo, tm)
            } else {
              $timeout.cancel(interval);
              interval = $timeout(function () { console.log("teste"); getInfo() }, tm)
            }
          });
        }
        , getFinishedForFree = function (village) {
          var lt = [];
          var job = village.getRecruitingQueue("barracks").jobs[0];
          if (job) {
            var timer = job.data.completed * 1000;
            var dif = timer - time.convertedTime();
            dif < conf.MIN_INTERVAL ? dif = conf.MIN_INTERVAL : dif;
            lt.push(dif);
            lt.push(data_cdr.interval);
          }
          var t = data_cdr.interval > 0 ? data_cdr.interval : data_cdr.interval = conf.INTERVAL.CDR;
          if (lt.length) {
            t = Math.min.apply(null, lt);
          }
          return t || 0;
        }
        , setList = function (job, callback) {
          min_time = Math.min.apply(null, [min_time, conf.INTERVAL.CDR]);
          if (job && job.time_next_reset) {
            min_time = Math.min.apply(null, [1e3 * job.time_next_reset - Date.now() + 1e3, min_time])
          }
          if (job && job.id && job.state == 0) {
            min_time = Math.min.apply(null, [1e3 * job.time_completed - Date.now() + 1e3, min_time])
          }
          data_cdr.interval = min_time
          data_cdr.complete = time.convertedTime() + min_time
          data_cdr.set();
          $rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE, { name: "CDR" })
          if (callback && typeof (callback) == "function") { callback(min_time) }
        }
        , coins = function () {
          data_log_cdr.logs.push({
            "text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "cdr"),
            "date": time.convertedTime()
          })
          var hasAcademy = function hasAcademy(village) {
            return !!village.getBuildingData().getBuildingLevel("academy");
          }

          var vls = modelDataService.getSelectedCharacter().getVillageList();
          let vls_coins = []
            , vls_nobles = [];

          Object.keys(vls).map(function (elem) {
            if (!data_villages.villages[vls[elem].getId()] || !hasAcademy(vls[elem])) {
              return undefined
            }
            let gt = getFinishedForFree(vls[elem]);
            if (gt != Infinity && gt != 0 && !isNaN(gt)) {
              min_time = Math.min.apply(null, [min_time, getFinishedForFree(vls[elem])]);
            }
            if (data_villages.villages[vls[elem].getId()].coins_activate) {
              vls_coins.push(vls[elem])
            }
            if (data_villages.villages[vls[elem].getId()].nobles_activate) {
              vls_nobles.push(vls[elem])
            }
          })

          noblesSteps(vls_nobles, function () {
            coinsSteps(vls_coins)
          })
        }
        , startJob = function (job) {
          return $timeout(function () {
            wait(job)
            socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_START_JOB, {
              job_id: job.id
            })
          }, 3000)
        }
        , collectJob = function (job, callback) {
          socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_COLLECT, {
            job_id: job.id,
            village_id: modelDataService.getSelectedVillage().getId()
          })
        }
        , sortJobs = function (jobs) {
          return jobs.sort(function (a, b) {
            return a.duration - b.duration
          })[0]
        }
        , onQuestsChanged = function () {
          var questLines = modelDataService.getSelectedCharacter().getQuestLineListModel().getQuestLineModels()
          if (questLines) {
            questLines.forEach(function (questLineModel) {
              let firstFinishableQuestIndex = questLineModel.getFirstFinishableQuestIndex(),
                questIndex = firstFinishableQuestIndex >= 0 ? firstFinishableQuestIndex : questLineModel.getFirstSelectableQuestIndex();
              let questModel = questLineModel.getQuestByIndex(questIndex)
              if (questModel.isFinishable()) {
                socketService.emit(providers.routeProvider.QUEST_FINISH_QUEST, {
                  'quest_id': questModel.getId(),
                  'village_id': modelDataService.getSelectedVillage().getId()
                });
              }
            })
          }
        }
        , verify_deposit = function ($event, job) {
          job && job.id ? wait(job) : null;
          $timeout(function () {
            searching = false;
            var resourceDepositModel = modelDataService.getSelectedCharacter().getResourceDeposit();
            if (!resourceDepositModel || !data_cdr.activated) {
              coins();
              return !1;
            }
            let n_job = resourceDepositModel.getCurrentJob()
            if (n_job) {
              wait(n_job)
              coins()
              return !1;
            }
            if (resourceDepositModel.getCollectibleJobs())
              return collectJob(resourceDepositModel.getCollectibleJobs().shift());
            var readyJobs = resourceDepositModel.getReadyJobs();
            if (readyJobs)
              return startJob(sortJobs(readyJobs));
            let milestones = resourceDepositModel.getMilestones()
              , contained = milestones.some(function (mil) {
                return mil.type == "effect" && mil.icon == "food_capacity_increase"
              })
            var reroll = modelDataService.getInventory().getItemByType("resource_deposit_reroll");
            if (reroll && reroll.amount > 0 && resourceDepositModel.getMilestones().length && (data_cdr.use_reroll || (contained && data_cdr.auto_reroll))) {
              socketService.emit(providers.routeProvider.PREMIUM_USE_ITEM, {
                village_id: modelDataService.getSelectedVillage().getId(),
                item_id: reroll.id
              }, coins)
            } else {
              coins()
            }
          }, 5000)
        }
        , getInfo = function () {
          if (!searching) {
            searching = true;
            socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_GET_INFO, {})
            socketService.emit(providers.routeProvider.QUESTS_GET_QUEST_LINES);
            wait();
          }
        }
        , getrenameCmdAtackRecon = function (command, unitText) {

          let old_name_cmd = command.command_name
            , old_name_unit = unitText
            , new_name_cmd
            , new_name_unit
            , split_old_name_cmd = old_name_cmd.split("_")
            , split_old_name_unit = old_name_cmd.split("_");

          if (split_old_name_cmd.lenght > 0) {
            new_name_cmd = split_old_name_cmd[0].slice(0, 1) + split_old_name_cmd[1].slice(0, 1)
          } else {
            new_name_cmd = split_old_name_cmd[0].slice(0, 3)
          }
          if (split_old_name_unit.lenght > 0) {
            new_name_unit = split_old_name_unit[0].slice(0, 1) + split_old_name_unit[1].slice(0, 1)
          } else {
            new_name_unit = split_old_name_unit[0].slice(0, 3)
          }

          if (!promise_rename && new_name_cmd != new_name_unit) {
            promise_rename = new Promise(function (resol, rejec) {
              socketService.emit(providers.routeProvider.COMMAND_RENAME, {
                command_id: command.command_id,
                name: new_name_unit
              });
              $timeout(function () {
                resol()
              }, 5000)
            }).then(function () {
              promise_rename = undefined
              if (promise_rename_queue.length) {
                let tr = promise_rename_queue.shift();
                getrenameCmdAtackRecon(tr[0], tr[1])
              }
            }, function () {
              promise_rename = undefined
              if (promise_rename_queue.length) {
                let tr = promise_rename_queue.shift();
                getrenameCmdAtackRecon(tr[0], tr[1])
              }
            })
          } else {
            promise_rename_queue.push([command, unitText])
          }

        }
        , getAttackTypeAtackRecon = function (command, i) {
          var x1 = command.origin_x
            , y1 = command.origin_y
            , x2 = command.target_x
            , y2 = command.target_y
            , seconds_duration = (command.model.completedAt - command.model.startedAt) / 1000
            , minutes_duration = seconds_duration / 60
            , cmdname = command.command_name
            , cmdType = command.command_type
            , target_character_name = command.target_character_name
            , officer_supporter = command.officer_supporter;

          if (y1 % 2) //se y é impar
            x1 += .5;
          if (y2 % 2)
            x2 += .5;
          var dy = y1 - y2
            , dx = x1 - x2
            , distancia = Math.abs(Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2) * 0.75)));
          if (officer_supporter != 0 && officer_supporter != undefined) { //Verifica se possui oficial tático
            distancia = distancia / 2;
          }

          //if (target_character_name == "Bárbaros") {
          //return "Farm BB";
          //} else {

          var t = modelDataService.getGameData().data.units.map(function (obj, index, array) {
            if (obj.name != "knight") {
              return [obj.speed, obj.name]
            }
          }).filter(f => f != undefined).map(m => {
            return [m[0], m[1], Math.abs(minutes_duration - Math.round(m[0] * distancia))];
          }).sort((a, b) => {
            return a[2] - b[2];
          });

          var units_ret = [];

          angular.extend(units_ret, t);

          var unit = units_ret.shift();

          var y = t.map(function (obj, index, array) {
            if (obj[0] == unit[0]) {
              return $filter("i18n")(obj[1], $rootScope.loc.ale, "units");
            } else {
              return
            }
          }).sort(function (a, b) { return a < b }).filter(f => f != undefined).join(" / ")

          var unitText = y;

          var classe = "icon-34x34-attack-red";

          var span_unit = undefined;
          switch (true) {
            case unitText.includes($filter("i18n")("snob", $rootScope.loc.ale, "units")):
              span_unit = "snob"
              break;
            case unitText.includes($filter("i18n")("trebuchet", $rootScope.loc.ale, "units")):
              span_unit = "trebuchet"
              break;
            case unitText.includes($filter("i18n")("sword", $rootScope.loc.ale, "units")):
              span_unit = "sword"
              break;
            case unitText.includes($filter("i18n")("ram", $rootScope.loc.ale, "units")):
              span_unit = "ram"
              break;
            case unitText.includes($filter("i18n")("light_cavalry", $rootScope.loc.ale, "units")):
              span_unit = "light_cavalry"
              break;
            case unitText.includes($filter("i18n")("heavy_cavalry", $rootScope.loc.ale, "units")):
              span_unit = "heavy_cavalry"
              break;
            case unitText.includes($filter("i18n")("axe", $rootScope.loc.ale, "units")):
              if (cmdType == "attack") {
                span_unit = "axe"
              } else {
                span_unit = "spear"
              }
              break;
          }

          let pai_type = document.querySelectorAll('span.type');
          let pai_edit = document.querySelectorAll('span.edit');

          switch (cmdType) {
            case "attack":
              if (span_unit != undefined) {
                pai_type[i].classList.remove("icon-34x34-attack");
                pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
                pai_edit[i].classList.remove("icon-34x34-edit");
                pai_edit[i].classList.add(classe);
              }
              break;
            case "relocate":
              pai_type[i].classList.remove("icon-34x34-relocate");
              pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
              pai_edit[i].classList.remove("icon-34x34-edit");
              pai_edit[i].classList.add("icon-34x34-relocate");
              break;
            case "support":
              pai_type[i].classList.remove("icon-34x34-support");
              pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
              pai_edit[i].classList.remove("icon-34x34-edit");
              pai_edit[i].classList.add("icon-34x34-support");
              break;
          }

          return unitText;
          //}
        }
        , setNewHandlersAtackRecon = function () {
          if (!overviewService) {
            overviewService = injector.get("overviewService");
          }
          overviewService.gameFormatCommand = overviewService.formatCommand;
          var i = 0
            , OverviewController = undefined

          overviewService.formatCommand = function (command) {
            overviewService.gameFormatCommand(command);

            if (isPaused) { return }

            if (!OverviewController) {
              OverviewController = robotTW2.loadController("OverviewController")
            } else if (i < 1) {
              OverviewController = robotTW2.loadController("OverviewController")
            }

            if (!OverviewController) { return }

            $timeout(function () {
              var elem = undefined;
              document.querySelectorAll(".command-type")[i] ? elem = (document.querySelectorAll(".command-type")[i]).querySelectorAll("div")[0] : i = 0;
              if (elem) {
                if (OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING) {
                  var unitText = getAttackTypeAtackRecon(command, i);
                  if (unitText != undefined) {
                    if (Object.keys(data_cdr.rename).map(function (elem, index, array) {
                      return unitText.includes($filter("i18n")(elem, $rootScope.loc.ale, "units"))
                    }).filter(f => f != undefined).length && data_cdr.active_rename) {
                      getrenameCmdAtackRecon(command, unitText);
                    }
                  }
                  elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
                  i++;
                  if (document.querySelectorAll('span.type').length === i) {
                    i = 0;
                  }

                } else if (OverviewController.activeTab == OverviewController.TABS.COMMANDS) {
                  elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
                  i++;
                  if (document.querySelectorAll('span.type').length === i) {
                    i = 0;
                  }
                }
                elem.addEventListener("mouseenter", function (a) {
                  $rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_SHOW, "tooltip", elem.innerText, true, elem)
                }),
                  elem.addEventListener("mouseleave", function () {
                    $rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_HIDE, "tooltip")
                  })
              }
              if (!OverviewController) { return }
              if (!OverviewController.$$phase) OverviewController.$apply();
            }, 200)
          }
        }
        , init = function () {
          isInitialized = !0
          start();
        }
        , start = function () {
          if (isRunning) { return }
          ready(function () {
            interval_cicle = setInterval(getInfo, data_cdr.interval)

            !listener_coins ? listener_coins = $rootScope.$on(providers.eventTypeProvider.ACADEMY_MASS_MINT_FINISHED, coins) : listener_coins;

            !listener_quest_collect ? listener_quest_collect = $rootScope.$on(providers.eventTypeProvider.QUESTS_QUEST_LINES, onQuestsChanged) : listener_quest_collect;

            !listener_quest_finished ? listener_quest_finished = $rootScope.$on(providers.eventTypeProvider.QUESTS_QUEST_FINISHED, getInfo) : listener_quest_finished;

            !listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function () {
              min_time = conf.INTERVAL.CDR; getInfo()
              $timeout(function () {
              }, 3000)
            }) : listener_job_collect;

            !listener_job_rerolled ? listener_job_rerolled = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, getInfo) : listener_job_rerolled;

            !listener_job_info ? listener_job_info = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_INFO, verify_deposit) : listener_job_info;

            !listener_job_collectible ? listener_job_collectible = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, verify_deposit) : listener_job_collectible;

            setNewHandlersAtackRecon()
            isRunning = !0;
            $rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "CDR" })

            getInfo()
          }, ["all_villages_ready"])
        }
        , stop = function () {
          typeof (listener_coins) == "function" ? listener_coins() : null;
          typeof (listener_quest_collect) == "function" ? listener_quest_collect() : null;
          typeof (listener_quest_finished) == "function" ? listener_quest_finished() : null;
          typeof (listener_job_collect) == "function" ? listener_job_collect() : null;
          typeof (listener_job_rerolled) == "function" ? listener_job_rerolled() : null;
          typeof (listener_job_collectible) == "function" ? listener_job_collectible() : null;
          typeof (listener_job_info) == "function" ? listener_job_info() : null;
          listener_coins = undefined;
          listener_quest_collect = undefined;
          listener_quest_finished = undefined;
          listener_job_collect = undefined;
          listener_job_rerolled = undefined;
          listener_job_collectible = undefined;
          listener_job_info = undefined;

          promise_nobles = undefined
          queue_nobles = []
          isRunning = !1
          $rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "CDR" })
          interval = null
          interval_cicle = null
        }
        , setPaused = function () {
          if (!paused_promise) {
            paused_promise = new Promise(function (resolve, reject) {
              $timeout(function () {
                resolve()
              }, 65000)
            }).then(function () {
              data_log_cdr.logs.push(
                {
                  "text": "Paused",
                  "date": time.convertedTime()
                }
              )
              data_log.set()
              isPaused = !0
              paused_promise = undefined;
              if (paused_queue) {
                paused_queue = false;
                setPaused()
              } else {
                setResumed()
              }
            }, function () {
              paused_promise = undefined;
              setResumed()
            })
          } else {
            paused_queue = true;
          }
        }
        , setResumed = function () {
          data_log_cdr.logs.push(
            {
              "text": "Resumed",
              "date": time.convertedTime()
            }
          )
          data_log.set()
          isPaused = !1
          $rootScope.$broadcast(providers.eventTypeProvider.RESUME)
        }
      return {
        init: init,
        start: start,
        stop: stop,
        isRunning: function () {
          return isRunning
        },
        isPaused: function () {
          return isPaused
        },
        isInitialized: function () {
          return isInitialized
        },
        version: conf.VERSION.CDR,
        name: "cdr"
      }
    })(
      robotTW2.services.$rootScope,
      robotTW2.services.socketService,
      robotTW2.providers,
      robotTW2.services.groupService,
      robotTW2.services.modelDataService,
      robotTW2.services.overviewService,
      robotTW2.services.academyService,
      robotTW2.services.recruitingService,
      robotTW2.services.$timeout,
      robotTW2.services.$filter,
      robotTW2.ready
    )
  })
