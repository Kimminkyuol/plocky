(function () {
  'use strict';
  var Java = window.Blockly && window.Blockly.Java;
  if (!Java) { console.error('[Plocky] Blockly.Java not found'); return; }

  function num(block, name) { return Java.valueToCode(block, name, Java.ORDER_NONE) || '0'; }
  function str(block, name) { return Java.valueToCode(block, name, Java.ORDER_NONE) || '""'; }

  // ─── event generators ─────────────────────────────────────────────────────

  Java['event_get'] = function (block) {
    return [block.getFieldValue('OPTION').split(',')[1], Java.ORDER_FUNCTION_CALL];
  };

  Java['event_cancel'] = function () { return 'event.setCancelled(true);\n'; };

  Java['event_set_message'] = function (block) {
    var type = block.getFieldValue('TYPE');
    var msg = str(block, 'MESSAGE');
    if (type === 'JOIN') return 'event.setJoinMessage((String) ' + msg + ');\n';
    if (type === 'QUIT') return 'event.setQuitMessage((String) ' + msg + ');\n';
    if (type === 'DEATH') return 'event.setDeathMessage((String) ' + msg + ');\n';
    if (type === 'CHAT') return 'event.setMessage((String) ' + msg + ');\n';
    return '';
  };

  Java['event_set_damage'] = function (block) {
    return 'event.setDamage((double) ' + num(block, 'DAMAGE') + ');\n';
  };

  Java['event_server_state_change'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    var state = block.getFieldValue('STATE');
    var eventClass, methodName;
    if (state === 'ENABLE') {
      eventClass = 'PluginEnableEvent'; methodName = 'onPluginEnable';
      Java.definitions_['import_PluginEnableEvent'] = 'import org.bukkit.event.server.PluginEnableEvent;';
    } else {
      eventClass = 'PluginDisableEvent'; methodName = 'onPluginDisable';
      Java.definitions_['import_PluginDisableEvent'] = 'import org.bukkit.event.server.PluginDisableEvent;';
    }
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void ' + methodName + '(' + eventClass + ' event) {\n' + branch + '}';
    Java.definitions_['%' + methodName] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_interact'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerInteractEvent'] = 'import org.bukkit.event.player.PlayerInteractEvent;';
    Java.definitions_['import_Action'] = 'import org.bukkit.event.block.Action;';
    var action = 'Action.' + block.getFieldValue('ACTION');
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerInteract(PlayerInteractEvent event) {\n    if (event.getAction() == ' + action + ') {\n' + branch + '    }\n}';
    Java.definitions_['%onPlayerInteract'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_join'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerJoinEvent'] = 'import org.bukkit.event.player.PlayerJoinEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerJoin(PlayerJoinEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerJoin'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_quit'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerQuitEvent'] = 'import org.bukkit.event.player.PlayerQuitEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerQuit(PlayerQuitEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerQuit'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_walk'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerMoveEvent'] = 'import org.bukkit.event.player.PlayerMoveEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerMove(PlayerMoveEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerMove'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_death'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerDeathEvent'] = 'import org.bukkit.event.entity.PlayerDeathEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerDeath(PlayerDeathEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerDeath'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_player_respawn'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_PlayerRespawnEvent'] = 'import org.bukkit.event.player.PlayerRespawnEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerRespawn(PlayerRespawnEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerRespawn'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_chat'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_AsyncPlayerChatEvent'] = 'import org.bukkit.event.player.AsyncPlayerChatEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onPlayerChat(AsyncPlayerChatEvent event) {\n' + branch + '}';
    Java.definitions_['%onPlayerChat'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_block_break'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_BlockBreakEvent'] = 'import org.bukkit.event.block.BlockBreakEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onBlockBreak(BlockBreakEvent event) {\n' + branch + '}';
    Java.definitions_['%onBlockBreak'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_block_place'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_BlockPlaceEvent'] = 'import org.bukkit.event.block.BlockPlaceEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onBlockPlace(BlockPlaceEvent event) {\n' + branch + '}';
    Java.definitions_['%onBlockPlace'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_entity_damage'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_EntityDamageEvent'] = 'import org.bukkit.event.entity.EntityDamageEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onEntityDamage(EntityDamageEvent event) {\n' + branch + '}';
    Java.definitions_['%onEntityDamage'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_entity_damage_by_entity'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    Java.definitions_['import_EntityDamageByEntityEvent'] = 'import org.bukkit.event.entity.EntityDamageByEntityEvent;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void onEntityDamageByEntity(EntityDamageByEntityEvent event) {\n' + branch + '}';
    Java.definitions_['%onEntityDamageByEntity'] = Java.scrub_(block, code);
    return null;
  };

  Java['event_inventory'] = function (block) {
    Java.definitions_['import_EventHandler'] = 'import org.bukkit.event.EventHandler;';
    var action = block.getFieldValue('ACTION');
    var eventClass, methodName;
    if (action === 'CLICK') { eventClass = 'InventoryClickEvent'; methodName = 'onInventoryClick'; Java.definitions_['import_InventoryClickEvent'] = 'import org.bukkit.event.inventory.InventoryClickEvent;'; }
    else if (action === 'CLOSE') { eventClass = 'InventoryCloseEvent'; methodName = 'onInventoryClose'; Java.definitions_['import_InventoryCloseEvent'] = 'import org.bukkit.event.inventory.InventoryCloseEvent;'; }
    else { eventClass = 'InventoryOpenEvent'; methodName = 'onInventoryOpen'; Java.definitions_['import_InventoryOpenEvent'] = 'import org.bukkit.event.inventory.InventoryOpenEvent;'; }
    var branch = Java.statementToCode(block, 'DO');
    var code = '@EventHandler\npublic void ' + methodName + '(' + eventClass + ' event) {\n' + branch + '}';
    Java.definitions_['%' + methodName] = Java.scrub_(block, code);
    return null;
  };

  // ─── executor generators ───────────────────────────────────────────────────

  Java['executor_message'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').sendMessage((String) ' + str(block, 'TEXT') + ');\n';
  };

  Java['executor_action_bar'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').sendActionBar((String) ' + str(block, 'TEXT') + ');\n';
  };

  Java['executor_send_title'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER');
    return '((Player) ' + p + ').sendTitle((String) ' + str(block, 'TITLE') + ', (String) ' + str(block, 'SUBTITLE') + ', (int)((double)(' + num(block, 'FADE_IN') + ')), (int)((double)(' + num(block, 'STAY') + ')), (int)((double)(' + num(block, 'FADE_OUT') + ')));\n';
  };

  Java['executor_broadcast'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return 'Bukkit.broadcastMessage((String) ' + str(block, 'TEXT') + ');\n';
  };

  Java['executor_log'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return 'Bukkit.getLogger().info((String) ' + str(block, 'TEXT') + ');\n';
  };

  Java['executor_kill'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setHealth(0);\n';
  };

  Java['executor_kick'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').kickPlayer((String) ' + str(block, 'DUE') + ');\n';
  };

  Java['executor_teleport'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return '((Player) ' + num(block, 'PLAYER') + ').teleport((Location) ' + num(block, 'LOCATION') + ');\n';
  };

  Java['executor_velocity'] = function (block) {
    Java.definitions_['import_Vector'] = 'import org.bukkit.util.Vector;';
    var p = num(block, 'PLAYER');
    return '((org.bukkit.entity.Player) ' + p + ').setVelocity(new Vector((double)(' + num(block, 'X') + '), (double)(' + num(block, 'Y') + '), (double)(' + num(block, 'Z') + ')));\n';
  };

  Java['executor_set_health'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setHealth((double)(' + num(block, 'HEALTH') + '));\n';
  };

  Java['executor_set_max_health'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_Attribute'] = 'import org.bukkit.attribute.Attribute;';
    return '((Player) ' + num(block, 'PLAYER') + ').getAttribute(Attribute.GENERIC_MAX_HEALTH).setBaseValue((double)(' + num(block, 'HEALTH') + '));\n';
  };

  Java['executor_set_saturation'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setSaturation((float)((double)(' + num(block, 'SATURATION') + ')));\n';
  };

  Java['executor_set_exp'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setExp((float)((double)(' + num(block, 'EXP') + ')));\n';
  };

  Java['executor_give_exp'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').giveExp((int)((double)(' + num(block, 'AMOUNT') + ')));\n';
  };

  Java['executor_set_game_mode'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_GameMode'] = 'import org.bukkit.GameMode;';
    return '((Player) ' + num(block, 'PLAYER') + ').setGameMode(GameMode.' + (block.getFieldValue('GAME_MODE') || 'SURVIVAL') + ');\n';
  };

  Java['executor_set_fly_mode'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setFlying((boolean) ' + (Java.valueToCode(block, 'MODE', Java.ORDER_NONE) || 'false') + ');\n';
  };

  Java['executor_set_walk_speed'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setWalkSpeed((float)((double)(' + num(block, 'SPEED') + ')));\n';
  };

  Java['executor_set_fly_speed'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setFlySpeed((float)((double)(' + num(block, 'SPEED') + ')));\n';
  };

  Java['executor_set_display_name'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setDisplayName((String) ' + str(block, 'NAME') + ');\n';
  };

  Java['executor_give'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    return '((Player) ' + num(block, 'PLAYER') + ').getInventory().addItem((ItemStack) ' + num(block, 'ITEM') + ');\n';
  };

  Java['executor_set_item'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    return '((Player) ' + num(block, 'PLAYER') + ').getInventory().setItem((int)((double)(' + num(block, 'SLOT') + ')), (ItemStack) ' + num(block, 'ITEM') + ');\n';
  };

  Java['executor_clear_inventory'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').getInventory().clear();\n';
  };

  Java['executor_close_gui'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').closeInventory();\n';
  };

  Java['executor_burn'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').setFireTicks((int)((double)(' + num(block, 'TIME') + ')));\n';
  };

  Java['executor_play_sound'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    Java.definitions_['import_Sound'] = 'import org.bukkit.Sound;';
    var p = num(block, 'PLAYER');
    return '((Player) ' + p + ').playSound(((Player) ' + p + ').getLocation(), Sound.valueOf((String) ' + str(block, 'SOUND') + '), (float)((double)(' + num(block, 'VOLUME') + ')), (float)((double)(' + num(block, 'PITCH') + ')));\n';
  };

  Java['executor_potion'] = function (block) {
    Java.definitions_['import_PotionEffect'] = 'import org.bukkit.potion.PotionEffect;';
    Java.definitions_['import_PotionEffectType'] = 'import org.bukkit.potion.PotionEffectType;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return '((Player) ' + num(block, 'PLAYER') + ').addPotionEffect(new PotionEffect(PotionEffectType.getByName((String) ' + str(block, 'POTION') + '), (int)((double)(' + num(block, 'TIME') + ')), (int)((double)(' + num(block, 'TIER') + '))));\n';
  };

  Java['executor_clear_potion'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER');
    return '((Player) ' + p + ').getActivePotionEffects().forEach(effect -> ((Player) ' + p + ').removePotionEffect(effect.getType()));\n';
  };

  Java['executor_explosion'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    var loc = num(block, 'LOCATION');
    return '((Location) ' + loc + ').getWorld().createExplosion((Location) ' + loc + ', (float)((double)(' + num(block, 'POWER') + ')), (boolean) ' + (Java.valueToCode(block, 'FIRE', Java.ORDER_NONE) || 'false') + ');\n';
  };

  Java['executor_lightning'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    var loc = num(block, 'LOCATION');
    return '((Location) ' + loc + ').getWorld().strikeLightning((Location) ' + loc + ');\n';
  };

  Java['executor_set_block'] = function (block) {
    Java.definitions_['import_Material'] = 'import org.bukkit.Material;';
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return '((Location) ' + num(block, 'LOCATION') + ').getBlock().setType(Material.valueOf((String) ' + str(block, 'MATERIAL') + '));\n';
  };

  Java['executor_clear_entity'] = function (block) {
    Java.definitions_['import_Entity'] = 'import org.bukkit.entity.Entity;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var r = num(block, 'RADIUS');
    return '((Player) ' + num(block, 'PLAYER') + ').getNearbyEntities((double)(' + r + '), (double)(' + r + '), (double)(' + r + ')).stream().filter(entity -> !(entity instanceof Player)).forEach(Entity::remove);\n';
  };

  Java['executor_time'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return 'Bukkit.getWorld((String) ' + str(block, 'WORLD') + ').setTime((long)((double)(' + num(block, 'TIME') + ')));\n';
  };

  Java['executor_weather'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return 'Bukkit.getWorld((String) ' + str(block, 'WORLD') + ').setStorm((boolean) ' + (Java.valueToCode(block, 'STORM', Java.ORDER_NONE) || 'true') + ');\n';
  };

  Java['executor_command'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return 'Bukkit.getServer().dispatchCommand((Player) ' + num(block, 'PLAYER') + ', (String) ' + str(block, 'COMMAND') + ');\n';
  };

  Java['executor_op_command'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER'); var cmd = str(block, 'COMMAND');
    return 'try { ((Player) ' + p + ').setOp(true); Bukkit.getServer().dispatchCommand((Player) ' + p + ', (String) ' + cmd + '); } finally { ((Player) ' + p + ').setOp(false); }\n';
  };

  Java['executor_console_command'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return 'Bukkit.getServer().dispatchCommand(Bukkit.getServer().getConsoleSender(), (String) ' + str(block, 'COMMAND') + ');\n';
  };

  Java['executor_money'] = function (block) {
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return 'MainPluginName.getInstance().getServer().getServicesManager().getRegistration(net.milkbowl.vault.economy.Economy.class).getProvider().depositPlayer((Player) ' + num(block, 'PLAYER') + ', (double)(' + num(block, 'MONEY') + '));\n';
  };

  Java['executor_permission'] = function (block) {
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var opt = (block.getFieldValue('OPTION') || 'ADD') === 'ADD' ? 'Add' : 'Remove';
    return 'MainPluginName.getInstance().getServer().getServicesManager().getRegistration(net.milkbowl.vault.permission.Permission.class).getProvider().player' + opt + '((Player) ' + num(block, 'PLAYER') + ', (String) ' + str(block, 'PERMISSION') + ');\n';
  };

  Java['executor_db_put'] = function (block) {
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    return 'MainPluginName.getDB().getData().put(' + str(block, 'KEY') + ', ' + (Java.valueToCode(block, 'VALUE', Java.ORDER_NONE) || '""') + ');\n';
  };

  Java['executor_db_save'] = function () {
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    return 'MainPluginName.getDB().save();\n';
  };

  Java['executor_wait'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    var branch = Java.statementToCode(block, 'DO');
    var code = 'Bukkit.getScheduler().runTaskLater(MainPluginName.getInstance(), () -> {\n' + branch + '}, (long)((double)(' + num(block, 'TIME') + ')));\n';
    return Java.scrub_(block, code);
  };

  Java['executor_exit'] = function () { return 'if (true) return;\n'; };

  // ─── player generators ────────────────────────────────────────────────────

  Java['player_get_by_name'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return ['Bukkit.getPlayer((String) ' + str(block, 'NAME') + ')', Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_by_uuid'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_UUID'] = 'import java.util.UUID;';
    return ['Bukkit.getPlayer(UUID.fromString((String) ' + str(block, 'UUID') + '))', Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_string'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER'); var opt = block.getFieldValue('OPTION') || 'NAME';
    var map = { NAME: '.getName()', DISPLAY_NAME: '.getDisplayName()', UUID: '.getUniqueId().toString()', IP: '.getAddress().getAddress().getHostAddress()', GAME_MODE: '.getGameMode().name()', WORLD_NAME: '.getWorld().getName()', BIOME: '.getLocation().getBlock().getBiome().name()' };
    return ['((Player) ' + p + ')' + (map[opt] || '.getName()'), Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_number'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER'); var opt = block.getFieldValue('OPTION') || 'HEALTH';
    var map = {
      HEALTH: '.getHealth()', MAX_HEALTH: null, FOOD: '.getFoodLevel()', AIR: '.getRemainingAir()',
      EXP: '.getExp()', EXP_LEVEL: '.getLevel()', TOTAL_EXP: '.getTotalExperience()',
      X_LOCATION: '.getLocation().getX()', Y_LOCATION: '.getLocation().getY()', Z_LOCATION: '.getLocation().getZ()',
      YAW: '.getLocation().getYaw()', PITCH: '.getLocation().getPitch()',
      FIRST_EMPTY_SLOT: '.getInventory().firstEmpty()', FIRE_TICKS: '.getFireTicks()',
      PING: '.getPing()', WORLD_TIME: '.getWorld().getTime()', ONLINE_COUNT: '.getServer().getOnlinePlayers().size()'
    };
    if (opt === 'MAX_HEALTH') {
      Java.definitions_['import_Attribute'] = 'import org.bukkit.attribute.Attribute;';
      return ['((Player) ' + p + ').getAttribute(Attribute.GENERIC_MAX_HEALTH).getValue()', Java.ORDER_FUNCTION_CALL];
    }
    return ['((Player) ' + p + ')' + (map[opt] || '.getHealth()'), Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_boolean'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER'); var opt = block.getFieldValue('OPTION') || 'OP';
    var map = { OP: '.isOp()', FLYING: '.isFlying()', SPRINTING: '.isSprinting()', SNEAKING: '.isSneaking()', ONLINE: '.isOnline()', IN_WATER: '.isInWater()' };
    if (opt === 'BURNING') return ['(((Player) ' + p + ').getFireTicks() > 0)', Java.ORDER_FUNCTION_CALL];
    return ['((Player) ' + p + ')' + (map[opt] || '.isOp()'), Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_location'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return ['((Player) ' + num(block, 'PLAYER') + ').getLocation()', Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_item'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    var p = num(block, 'PLAYER'); var opt = block.getFieldValue('OPTION') || 'MAIN_HAND';
    var map = { MAIN_HAND: '.getInventory().getItemInMainHand()', OFF_HAND: '.getInventory().getItemInOffHand()', HELMET: '.getInventory().getHelmet()', CHESTPLATE: '.getInventory().getChestplate()', LEGGINGS: '.getInventory().getLeggings()', BOOTS: '.getInventory().getBoots()' };
    return ['((Player) ' + p + ')' + (map[opt] || '.getInventory().getItemInMainHand()'), Java.ORDER_FUNCTION_CALL];
  };

  Java['player_has_permission'] = function (block) {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return ['((Player) ' + num(block, 'PLAYER') + ').hasPermission((String) ' + str(block, 'PERMISSION') + ')', Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_any'] = function (block) {
    Java.definitions_['import_MyPluginName'] = 'import MainPluginPath.MainPluginName;';
    return ['MainPluginName.getDB().getData().get(' + str(block, 'KEY') + ')', Java.ORDER_FUNCTION_CALL];
  };

  Java['player_get_online_players'] = function () {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    return ['Bukkit.getOnlinePlayers()', Java.ORDER_FUNCTION_CALL];
  };

  // ─── location generators ───────────────────────────────────────────────────

  Java['location'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['new Location(Bukkit.getWorld((String) ' + str(block, 'WORLD') + '), (double)(' + num(block, 'X') + '), (double)(' + num(block, 'Y') + '), (double)(' + num(block, 'Z') + '))', Java.ORDER_FUNCTION_CALL];
  };

  Java['location_get_coord'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    var loc = num(block, 'LOCATION'); var axis = block.getFieldValue('AXIS') || 'X';
    var map = { X: '.getX()', Y: '.getY()', Z: '.getZ()', YAW: '.getYaw()', PITCH: '.getPitch()' };
    return ['((Location) ' + loc + ')' + (map[axis] || '.getX()'), Java.ORDER_FUNCTION_CALL];
  };

  Java['location_get_world'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['((Location) ' + num(block, 'LOCATION') + ').getWorld().getName()', Java.ORDER_FUNCTION_CALL];
  };

  Java['location_get_block_type'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['((Location) ' + num(block, 'LOCATION') + ').getBlock().getType().name()', Java.ORDER_FUNCTION_CALL];
  };

  Java['location_add'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['((Location) ' + num(block, 'LOCATION') + ').clone().add((double)(' + num(block, 'X') + '), (double)(' + num(block, 'Y') + '), (double)(' + num(block, 'Z') + '))', Java.ORDER_FUNCTION_CALL];
  };

  Java['location_distance'] = function (block) {
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['((Location) ' + num(block, 'LOC_A') + ').distance((Location) ' + num(block, 'LOC_B') + ')', Java.ORDER_FUNCTION_CALL];
  };

  // ─── item generators ───────────────────────────────────────────────────────

  Java['item_create'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    Java.definitions_['import_Material'] = 'import org.bukkit.Material;';
    return ['new ItemStack(Material.valueOf((String) ' + str(block, 'MATERIAL') + '))', Java.ORDER_FUNCTION_CALL];
  };

  Java['item_create_with_amount'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    Java.definitions_['import_Material'] = 'import org.bukkit.Material;';
    return ['new ItemStack(Material.valueOf((String) ' + str(block, 'MATERIAL') + '), (int)((double)(' + num(block, 'AMOUNT') + ')))', Java.ORDER_FUNCTION_CALL];
  };

  Java['item_get_type'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    return ['((ItemStack) ' + num(block, 'ITEM') + ').getType().name()', Java.ORDER_FUNCTION_CALL];
  };

  Java['item_get_amount'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    return ['((ItemStack) ' + num(block, 'ITEM') + ').getAmount()', Java.ORDER_FUNCTION_CALL];
  };

  Java['item_is_air'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    var item = num(block, 'ITEM');
    return ['(' + item + ' == null || ((ItemStack) ' + item + ').getType().isAir())', Java.ORDER_FUNCTION_CALL];
  };

  Java['item_set_display_name'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    Java.definitions_['import_ItemMeta'] = 'import org.bukkit.inventory.meta.ItemMeta;';
    var item = num(block, 'ITEM'); var id = block.id;
    return 'ItemMeta meta_' + id + ' = ((ItemStack) ' + item + ').getItemMeta();\nmeta_' + id + '.setDisplayName((String) ' + str(block, 'NAME') + ');\n((ItemStack) ' + item + ').setItemMeta(meta_' + id + ');\n';
  };

  Java['item_set_lore'] = function (block) {
    Java.definitions_['import_ItemStack'] = 'import org.bukkit.inventory.ItemStack;';
    Java.definitions_['import_ItemMeta'] = 'import org.bukkit.inventory.meta.ItemMeta;';
    Java.definitions_['import_Arrays'] = 'import java.util.Arrays;';
    var item = num(block, 'ITEM'); var id = block.id;
    return 'ItemMeta loreMeta_' + id + ' = ((ItemStack) ' + item + ').getItemMeta();\nloreMeta_' + id + '.setLore(Arrays.asList(((String) ' + str(block, 'LORE') + ').split("\\\\n")));\n((ItemStack) ' + item + ').setItemMeta(loreMeta_' + id + ');\n';
  };

  // ─── world generators ──────────────────────────────────────────────────────

  Java['world_get'] = function (block) {
    Java.definitions_['import_Bukkit'] = 'import org.bukkit.Bukkit;';
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return ['Bukkit.getWorld((String) ' + str(block, 'NAME') + ')', Java.ORDER_FUNCTION_CALL];
  };

  Java['world_get_block_at'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return ['((World) ' + num(block, 'WORLD') + ').getBlockAt((Location) ' + num(block, 'LOCATION') + ')', Java.ORDER_FUNCTION_CALL];
  };

  Java['world_spawn_entity'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    Java.definitions_['import_EntityType'] = 'import org.bukkit.entity.EntityType;';
    Java.definitions_['import_Location'] = 'import org.bukkit.Location;';
    return '((World) ' + num(block, 'WORLD') + ').spawnEntity((Location) ' + num(block, 'LOCATION') + ', EntityType.valueOf((String) ' + str(block, 'ENTITY_TYPE') + '));\n';
  };

  Java['world_get_time'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return ['((World) ' + num(block, 'WORLD') + ').getTime()', Java.ORDER_FUNCTION_CALL];
  };

  Java['world_set_time'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return '((World) ' + num(block, 'WORLD') + ').setTime((long)((double)(' + num(block, 'TIME') + ')));\n';
  };

  Java['world_get_weather'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return ['((World) ' + num(block, 'WORLD') + ').hasStorm()', Java.ORDER_FUNCTION_CALL];
  };

  Java['world_set_weather'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return '((World) ' + num(block, 'WORLD') + ').setStorm((boolean) ' + (Java.valueToCode(block, 'STORM', Java.ORDER_NONE) || 'true') + ');\n';
  };

  Java['world_get_players'] = function (block) {
    Java.definitions_['import_World'] = 'import org.bukkit.World;';
    return ['((World) ' + num(block, 'WORLD') + ').getPlayers()', Java.ORDER_FUNCTION_CALL];
  };

  // ─── command generators ──────────────────────────────────────────────────

  Java['command'] = function (block) {
    Java.definitions_['import_Command'] = 'import org.bukkit.command.Command;';
    Java.definitions_['import_CommandSender'] = 'import org.bukkit.command.CommandSender;';
    var branch = Java.statementToCode(block, 'DO');
    var code = '@Override\npublic boolean onCommand(CommandSender sender, Command command, String label, String[] args) {\n' + branch + '    return true;\n}';
    Java.definitions_['%onCommand'] = Java.scrub_(block, code);
    return null;
  };

  Java['command_get'] = function () { return ['sender', Java.ORDER_NONE]; };

  Java['command_player'] = function () {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return ['(Player) sender', Java.ORDER_NONE];
  };

  Java['command_check_sender_is_player'] = function () {
    Java.definitions_['import_Player'] = 'import org.bukkit.entity.Player;';
    return ['(sender instanceof Player)', Java.ORDER_NONE];
  };

  Java['command_arg'] = function (block) {
    return ['args[(int)((double)(' + num(block, 'INDEX') + '))]', Java.ORDER_NONE];
  };

  Java['command_args_length'] = function () { return ['args.length', Java.ORDER_NONE]; };

  Java['command_has_args'] = function () { return ['(args.length > 0)', Java.ORDER_NONE]; };

  console.log('[Plocky] plocky_java.js loaded');
})();
