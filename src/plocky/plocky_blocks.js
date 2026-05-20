(function () {
  'use strict';
  var B = window.Blockly;
  if (!B) { console.error('[Plocky] Blockly not found'); return; }

  var CANCEL_CHECK = {
    getSurroundEvent: function () {
      var b = this;
      do {
        if (b.type && b.type.indexOf('event_') === 0 && b.cancel_) return b;
        b = b.getSurroundParent ? b.getSurroundParent() : null;
      } while (b);
      return null;
    },
    onchange: function (e) {
      var mv = B.Events && (B.Events.BLOCK_MOVE || 'move');
      if (!this.workspace || (this.workspace.isDragging && this.workspace.isDragging()) || e.type !== mv) return;
      var ok = this.getSurroundEvent();
      this.setWarningText(ok ? null : 'This block may only be used within a cancellable event.');
      if (!this.isInFlyout) this.setEnabled(!!ok);
    }
  };

  var CMD_CHECK = {
    getSurroundLoop: function () {
      var b = this;
      do {
        if (b.type === 'command') return b;
        b = b.getSurroundParent ? b.getSurroundParent() : null;
      } while (b);
      return null;
    },
    onchange: function (e) {
      var mv = B.Events && (B.Events.BLOCK_MOVE || 'move');
      if (!this.workspace || (this.workspace.isDragging && this.workspace.isDragging()) || e.type !== mv) return;
      var ok = this.getSurroundLoop();
      this.setWarningText(ok ? null : 'This block may only be used within a command handler.');
      if (!this.isInFlyout) this.setEnabled(!!ok);
    }
  };

  // ─── event_get ───────────────────────────────────────────────────────────────

  B.Blocks['event_get'] = {
    init: function () {
      this.appendDummyInput('OPTION_DUMMY').appendField(new B.FieldDropdown([['event value', 'Object,null']]), 'OPTION');
      this.setOutput(true, null); this.setColour(65);
      this.setTooltip('Get a value from the surrounding event context.'); this.setHelpUrl('');
    },
    _refreshDropdown: function () {
      if (!this.gets_) return;
      var entries = Object.keys(this.gets_).map(function (k) {
        var p = this.gets_[k]; return [k, p[0] + ',' + p[1]];
      }, this);
      if (!entries.length) return;
      this.removeInput('OPTION_DUMMY', true);
      this.appendDummyInput('OPTION_DUMMY').appendField(new B.FieldDropdown(entries), 'OPTION');
      var v = this.getFieldValue('OPTION'); if (v) this.setOutput(true, v.split(',')[0] || null);
    },
    getSurroundEvent: function () {
      var b = this;
      while (b.getSurroundParent && b.getSurroundParent()) b = b.getSurroundParent();
      if (b && b.gets_) this.gets_ = b.gets_;
      if (this.gets_) { this._refreshDropdown(); return this; }
      return null;
    },
    onchange: function (e) {
      var ch = B.Events && (B.Events.BLOCK_CHANGE || 'change');
      var mv = B.Events && (B.Events.BLOCK_MOVE || 'move');
      if (e.type === ch) { var v = this.getFieldValue('OPTION'); if (v) this.setOutput(true, v.split(',')[0] || null); return; }
      if (!this.workspace || (this.workspace.isDragging && this.workspace.isDragging()) || e.type !== mv) return;
      var ok = this.getSurroundEvent();
      this.setWarningText(ok ? null : 'Place inside an event block.');
      if (!this.isInFlyout) this.setEnabled(!!ok);
    },
    saveExtraState: function () { return { gets: this.gets_ }; },
    loadExtraState: function (s) { this.gets_ = s.gets; this._refreshDropdown(); }
  };

  // ─── event_cancel ────────────────────────────────────────────────────────────

  B.Blocks['event_cancel'] = Object.assign({
    init: function () {
      this.appendDummyInput().appendField('cancel event');
      this.setPreviousStatement(true, null); this.setNextStatement(true, null);
      this.setColour(65); this.setTooltip('Prevent the event from happening.'); this.setHelpUrl('');
    }
  }, CANCEL_CHECK);

  // ─── event_set_message ───────────────────────────────────────────────────────

  B.Blocks['event_set_message'] = {
    init: function () {
      this.appendValueInput('MESSAGE').setCheck('String').appendField(new B.FieldDropdown([
        ['set join message', 'JOIN'], ['set quit message', 'QUIT'],
        ['set death message', 'DEATH'], ['set chat message', 'CHAT']
      ]), 'TYPE');
      this.setPreviousStatement(true, null); this.setNextStatement(true, null);
      this.setColour(65); this.setTooltip('Override the event message string.'); this.setHelpUrl('');
    }
  };

  // ─── event_server_state_change ───────────────────────────────────────────────

  B.Blocks['event_server_state_change'] = {
    init: function () {
      this.appendDummyInput().appendField('on server')
        .appendField(new B.FieldDropdown([['enable', 'ENABLE'], ['disable', 'DISABLE']]), 'STATE');
      this.appendStatementInput('DO').setCheck(null).appendField('do');
      this.setColour(65); this.setTooltip('Fires when the plugin is enabled or disabled.'); this.setHelpUrl('');
    }
  };

  // ─── event_player_interact ───────────────────────────────────────────────────

  B.Blocks['event_player_interact'] = {
    init: function () {
      this.appendDummyInput().appendField('on player').appendField(new B.FieldDropdown([
        ['left click air', 'LEFT_CLICK_AIR'], ['right click air', 'RIGHT_CLICK_AIR'],
        ['left click block', 'LEFT_CLICK_BLOCK'], ['right click block', 'RIGHT_CLICK_BLOCK'],
        ['physical (step)', 'PHYSICAL']
      ]), 'ACTION');
      this.appendStatementInput('DO').setCheck(null).appendField('do');
      this.setColour(65); this.setTooltip('Fires when a player interacts with the world.'); this.setHelpUrl('');
      this.gets_ = { 'event-player': ['Player', 'event.getPlayer()'], 'event-item': ['ItemStack', 'event.getItem()'], 'event-block': ['Block', 'event.getClickedBlock()'] };
      this.cancel_ = true;
    }
  };

  // ─── simple event blocks ─────────────────────────────────────────────────────

  function makeEventBlock(type, label, gets_, cancel_, tooltip) {
    B.Blocks[type] = {
      init: function () {
        this.appendDummyInput().appendField(label);
        this.appendStatementInput('DO').setCheck(null).appendField('do');
        this.setColour(65); this.setTooltip(tooltip || ''); this.setHelpUrl('');
        this.gets_ = gets_; this.cancel_ = cancel_;
      }
    };
  }

  makeEventBlock('event_player_join', 'on player join',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-join-message': ['String', 'event.getJoinMessage()'] }, false, 'Fires when a player joins the server.');
  makeEventBlock('event_player_quit', 'on player quit',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-quit-message': ['String', 'event.getQuitMessage()'] }, false, 'Fires when a player leaves the server.');
  makeEventBlock('event_player_walk', 'on player move',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-from': ['Location', 'event.getFrom()'], 'event-to': ['Location', 'event.getTo()'] }, true, 'Fires when a player moves.');
  makeEventBlock('event_player_death', 'on player death',
    { 'event-player': ['Player', 'event.getEntity()'], 'event-death-message': ['String', 'event.getDeathMessage()'] }, false, 'Fires when a player dies.');
  makeEventBlock('event_player_respawn', 'on player respawn',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-respawn-location': ['Location', 'event.getRespawnLocation()'] }, false, 'Fires when a player respawns.');
  makeEventBlock('event_chat', 'on player chat',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-message': ['String', 'event.getMessage()'] }, true, 'Fires when a player sends a chat message.');
  makeEventBlock('event_block_break', 'on block break',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-block': ['Block', 'event.getBlock()'], 'event-block-type': ['String', 'event.getBlock().getType().name()'] }, true, 'Fires when a player breaks a block.');
  makeEventBlock('event_block_place', 'on block place',
    { 'event-player': ['Player', 'event.getPlayer()'], 'event-block': ['Block', 'event.getBlock()'], 'event-block-type': ['String', 'event.getBlock().getType().name()'], 'event-item-in-hand': ['ItemStack', 'event.getItemInHand()'] }, true, 'Fires when a player places a block.');
  makeEventBlock('event_entity_damage', 'on entity damage',
    { 'event-entity': ['Entity', 'event.getEntity()'], 'event-damage': ['Number', 'event.getDamage()'], 'event-cause': ['String', 'event.getCause().name()'] }, true, 'Fires when any entity takes damage.');
  makeEventBlock('event_entity_damage_by_entity', 'on entity damage by entity',
    { 'event-entity': ['Entity', 'event.getEntity()'], 'event-damager': ['Entity', 'event.getDamager()'], 'event-damage': ['Number', 'event.getDamage()'] }, true, 'Fires when an entity is damaged by another entity.');

  B.Blocks['event_inventory'] = {
    init: function () {
      this.appendDummyInput().appendField('on inventory')
        .appendField(new B.FieldDropdown([['open', 'OPEN'], ['click', 'CLICK'], ['close', 'CLOSE']]), 'ACTION');
      this.appendStatementInput('DO').setCheck(null).appendField('do');
      this.setColour(65); this.setTooltip('Fires on inventory open, click, or close.'); this.setHelpUrl('');
      this.gets_ = { 'event-player': ['Player', 'event.getPlayer()'], 'event-inventory': ['Inventory', 'event.getInventory()'] };
      this.cancel_ = true;
    }
  };

  B.Blocks['event_set_damage'] = {
    init: function () {
      this.appendValueInput('DAMAGE').setCheck('Number').appendField('set damage to');
      this.setPreviousStatement(true, null); this.setNextStatement(true, null);
      this.setColour(65); this.setTooltip('Override the damage amount of a damage event.'); this.setHelpUrl('');
    }
  };

  // ─── executor blocks (JSON init) ─────────────────────────────────────────────

  [
    { type: 'executor_message', message0: 'send message %1 to %2', args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Send a chat message to a player.', helpUrl: '' },
    { type: 'executor_action_bar', message0: 'send action bar %1 to %2', args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Display text above the hotbar.', helpUrl: '' },
    { type: 'executor_send_title', message0: 'send title %1 subtitle %2 to %3 fade-in %4 stay %5 fade-out %6 ticks', args0: [{ type: 'input_value', name: 'TITLE', check: 'String' }, { type: 'input_value', name: 'SUBTITLE', check: 'String' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'FADE_IN', check: 'Number' }, { type: 'input_value', name: 'STAY', check: 'Number' }, { type: 'input_value', name: 'FADE_OUT', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Show a title and subtitle on screen.', helpUrl: '' },
    { type: 'executor_broadcast', message0: 'broadcast %1', args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Broadcast a message to all players.', helpUrl: '' },
    { type: 'executor_log', message0: 'log %1', args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Write a message to the server console log.', helpUrl: '' },
    { type: 'executor_set_health', message0: "set %1's health to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'HEALTH', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set actual health (0–max health).', helpUrl: '' },
    { type: 'executor_set_max_health', message0: "set %1's max health to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'HEALTH', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set maximum health via Attribute.', helpUrl: '' },
    { type: 'executor_set_saturation', message0: "set %1's saturation to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'SATURATION', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set food saturation (0.0–20.0).', helpUrl: '' },
    { type: 'executor_set_exp', message0: "set %1's exp to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'EXP', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set experience progress (0.0–1.0).', helpUrl: '' },
    { type: 'executor_give_exp', message0: 'give %1 %2 exp', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'AMOUNT', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Award experience points to a player.', helpUrl: '' },
    { type: 'executor_set_game_mode', message0: "set %1's game mode to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'field_dropdown', name: 'GAME_MODE', options: [['survival', 'SURVIVAL'], ['creative', 'CREATIVE'], ['adventure', 'ADVENTURE'], ['spectator', 'SPECTATOR']] }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Change the game mode of a player.', helpUrl: '' },
    { type: 'executor_set_fly_mode', message0: "set %1's fly mode to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'MODE', check: 'Boolean' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Enable or disable flying for a player.', helpUrl: '' },
    { type: 'executor_set_walk_speed', message0: "set %1's walk speed to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'SPEED', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set walking speed (-1.0 to 1.0).', helpUrl: '' },
    { type: 'executor_set_fly_speed', message0: "set %1's fly speed to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'SPEED', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set flying speed (-1.0 to 1.0).', helpUrl: '' },
    { type: 'executor_set_display_name', message0: "set %1's display name to %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'NAME', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Change the display name shown in chat and tab list.', helpUrl: '' },
    { type: 'executor_teleport', message0: 'teleport %1 to %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Teleport a player to a location.', helpUrl: '' },
    { type: 'executor_velocity', message0: "set %1's velocity x: %2  y: %3  z: %4", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'X', check: 'Number' }, { type: 'input_value', name: 'Y', check: 'Number' }, { type: 'input_value', name: 'Z', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Launch a player in the given direction.', helpUrl: '' },
    { type: 'executor_kill', message0: 'kill %1', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set player health to 0.', helpUrl: '' },
    { type: 'executor_kick', message0: 'kick %1 reason %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'DUE', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Disconnect a player with a reason message.', helpUrl: '' },
    { type: 'executor_give', message0: 'give item %1 to %2', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Add an item to a player inventory.', helpUrl: '' },
    { type: 'executor_set_item', message0: 'set slot %1 of %2 to %3', args0: [{ type: 'input_value', name: 'SLOT', check: 'Number' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'ITEM', check: 'ItemStack' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set a specific inventory slot.', helpUrl: '' },
    { type: 'executor_clear_inventory', message0: "clear %1's inventory", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Remove all items from a player inventory.', helpUrl: '' },
    { type: 'executor_close_gui', message0: 'close inventory of %1', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Force-close the open inventory GUI for a player.', helpUrl: '' },
    { type: 'executor_potion', message0: 'apply potion %1 tier %2 to %3 for %4 ticks', args0: [{ type: 'input_value', name: 'POTION', check: 'String' }, { type: 'input_value', name: 'TIER', check: 'Number' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'TIME', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Apply a potion effect by name (e.g. "SPEED").', helpUrl: '' },
    { type: 'executor_clear_potion', message0: 'remove all potion effects from %1', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Remove all active potion effects.', helpUrl: '' },
    { type: 'executor_burn', message0: 'set %1 on fire for %2 ticks', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'TIME', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set a player on fire for N ticks.', helpUrl: '' },
    { type: 'executor_play_sound', message0: 'play sound %1 to %2 volume %3 pitch %4', args0: [{ type: 'input_value', name: 'SOUND', check: 'String' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'VOLUME', check: 'Number' }, { type: 'input_value', name: 'PITCH', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Play a Sound to a player at their position.', helpUrl: '' },
    { type: 'executor_explosion', message0: 'create explosion power %1 at %2 fire %3', args0: [{ type: 'input_value', name: 'POWER', check: 'Number' }, { type: 'input_value', name: 'LOCATION', check: 'Location' }, { type: 'input_value', name: 'FIRE', check: 'Boolean' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Create an explosion at a location.', helpUrl: '' },
    { type: 'executor_lightning', message0: 'strike lightning at %1', args0: [{ type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Spawn a lightning bolt at the given location.', helpUrl: '' },
    { type: 'executor_set_block', message0: 'set block at %1 to %2', args0: [{ type: 'input_value', name: 'LOCATION', check: 'Location' }, { type: 'input_value', name: 'MATERIAL', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Place a block by material name at the location.', helpUrl: '' },
    { type: 'executor_clear_entity', message0: 'remove entities within %1 radius of %2', args0: [{ type: 'input_value', name: 'RADIUS', check: 'Number' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Remove all non-player entities within the radius.', helpUrl: '' },
    { type: 'executor_time', message0: 'set time of world %1 to %2', args0: [{ type: 'input_value', name: 'WORLD', check: 'String' }, { type: 'input_value', name: 'TIME', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Set the time in a world by name.', helpUrl: '' },
    { type: 'executor_weather', message0: 'set storm in world %1 to %2', args0: [{ type: 'input_value', name: 'WORLD', check: 'String' }, { type: 'input_value', name: 'STORM', check: 'Boolean' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Enable or disable rain in a world by name.', helpUrl: '' },
    { type: 'executor_command', message0: 'make %1 run command %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'COMMAND', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Dispatch a command as if the player typed it.', helpUrl: '' },
    { type: 'executor_op_command', message0: 'make %1 run op command %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'COMMAND', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Temporarily op the player, run the command, then de-op.', helpUrl: '' },
    { type: 'executor_console_command', message0: 'run console command %1', args0: [{ type: 'input_value', name: 'COMMAND', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Execute a command from the console sender.', helpUrl: '' },
    { type: 'executor_money', message0: 'add %1 coins to %2', args0: [{ type: 'input_value', name: 'MONEY', check: 'Number' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Deposit money via Vault Economy (requires Vault).', helpUrl: '' },
    { type: 'executor_permission', message0: '%1 permission %2 to %3', args0: [{ type: 'field_dropdown', name: 'OPTION', options: [['add', 'ADD'], ['remove', 'REMOVE']] }, { type: 'input_value', name: 'PERMISSION', check: 'String' }, { type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Add or remove a permission node (requires Vault).', helpUrl: '' },
    { type: 'executor_db_put', message0: 'database put key %1 value %2', args0: [{ type: 'input_value', name: 'KEY', check: 'String' }, { type: 'input_value', name: 'VALUE', check: null }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Store a key-value pair in the plugin database.', helpUrl: '' },
    { type: 'executor_db_save', message0: 'database save', args0: [], previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Persist the plugin database to disk.', helpUrl: '' },
    { type: 'executor_wait', message0: 'after %1 ticks do %2', args0: [{ type: 'input_value', name: 'TIME', check: 'Number' }, { type: 'input_statement', name: 'DO' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 160, tooltip: 'Schedule code to run after N ticks (20 ticks = 1 second).', helpUrl: '' },
    { type: 'executor_exit', message0: 'exit', args0: [], previousStatement: null, colour: 160, tooltip: 'Return from the current handler immediately.', helpUrl: '' }
  ].forEach(function (d) { B.Blocks[d.type] = { init: function () { this.jsonInit(d); } }; });

  // ─── player blocks ───────────────────────────────────────────────────────────

  [
    { type: 'player_get_by_name', message0: 'get player by name %1', args0: [{ type: 'input_value', name: 'NAME', check: 'String' }], inputsInline: true, output: 'Player', colour: 230, tooltip: 'Returns an online Player by their username.', helpUrl: '' },
    { type: 'player_get_by_uuid', message0: 'get player by UUID %1', args0: [{ type: 'input_value', name: 'UUID', check: 'String' }], inputsInline: true, output: 'Player', colour: 230, tooltip: 'Returns an online Player by their UUID string.', helpUrl: '' },
    { type: 'player_get_string', message0: "get %1's %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'field_dropdown', name: 'OPTION', options: [['name', 'NAME'], ['display name', 'DISPLAY_NAME'], ['UUID', 'UUID'], ['IP address', 'IP'], ['game mode', 'GAME_MODE'], ['world name', 'WORLD_NAME'], ['biome', 'BIOME']] }], inputsInline: true, output: 'String', colour: 230, tooltip: 'Get a String property of a player.', helpUrl: '' },
    { type: 'player_get_number', message0: "get %1's %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'field_dropdown', name: 'OPTION', options: [['health', 'HEALTH'], ['max health', 'MAX_HEALTH'], ['food level', 'FOOD'], ['remaining air', 'AIR'], ['exp', 'EXP'], ['exp level', 'EXP_LEVEL'], ['total exp', 'TOTAL_EXP'], ['X', 'X_LOCATION'], ['Y', 'Y_LOCATION'], ['Z', 'Z_LOCATION'], ['yaw', 'YAW'], ['pitch', 'PITCH'], ['first empty slot', 'FIRST_EMPTY_SLOT'], ['fire ticks', 'FIRE_TICKS'], ['ping (ms)', 'PING'], ['world time', 'WORLD_TIME'], ['online player count', 'ONLINE_COUNT']] }], inputsInline: true, output: 'Number', colour: 230, tooltip: 'Get a numeric property of a player.', helpUrl: '' },
    { type: 'player_get_boolean', message0: 'is %1 %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'field_dropdown', name: 'OPTION', options: [['op', 'OP'], ['flying', 'FLYING'], ['sprinting', 'SPRINTING'], ['on fire', 'BURNING'], ['sneaking', 'SNEAKING'], ['online', 'ONLINE'], ['in water', 'IN_WATER']] }], inputsInline: true, output: 'Boolean', colour: 230, tooltip: 'Check a boolean state of a player.', helpUrl: '' },
    { type: 'player_get_location', message0: "get %1's location", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }], inputsInline: true, output: 'Location', colour: 230, tooltip: "Returns the player's current Location.", helpUrl: '' },
    { type: 'player_get_item', message0: "get %1's %2", args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'field_dropdown', name: 'OPTION', options: [['held item (main hand)', 'MAIN_HAND'], ['held item (off hand)', 'OFF_HAND'], ['helmet', 'HELMET'], ['chestplate', 'CHESTPLATE'], ['leggings', 'LEGGINGS'], ['boots', 'BOOTS']] }], inputsInline: true, output: 'ItemStack', colour: 230, tooltip: 'Get an item from the player equipment.', helpUrl: '' },
    { type: 'player_has_permission', message0: '%1 has permission %2', args0: [{ type: 'input_value', name: 'PLAYER', check: 'Player' }, { type: 'input_value', name: 'PERMISSION', check: 'String' }], inputsInline: true, output: 'Boolean', colour: 230, tooltip: 'Returns true if the player has the given permission node.', helpUrl: '' },
    { type: 'player_get_any', message0: 'get database key %1', args0: [{ type: 'input_value', name: 'KEY', check: 'String' }], inputsInline: true, output: null, colour: 230, tooltip: 'Get a value from the plugin database by key.', helpUrl: '' },
    { type: 'player_get_online_players', message0: 'get all online players', args0: [], output: null, colour: 230, tooltip: 'Returns a collection of all online players.', helpUrl: '' }
  ].forEach(function (d) { B.Blocks[d.type] = { init: function () { this.jsonInit(d); } }; });

  // ─── location blocks ─────────────────────────────────────────────────────────

  [
    { type: 'location', message0: 'location world: %1  x: %2  y: %3  z: %4', args0: [{ type: 'input_value', name: 'WORLD', check: 'String' }, { type: 'input_value', name: 'X', check: 'Number' }, { type: 'input_value', name: 'Y', check: 'Number' }, { type: 'input_value', name: 'Z', check: 'Number' }], inputsInline: true, output: 'Location', colour: 290, tooltip: 'Create a Location from world name and coordinates.', helpUrl: '' },
    { type: 'location_get_coord', message0: 'get %1 of location %2', args0: [{ type: 'field_dropdown', name: 'AXIS', options: [['X', 'X'], ['Y', 'Y'], ['Z', 'Z'], ['yaw', 'YAW'], ['pitch', 'PITCH']] }, { type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, output: 'Number', colour: 290, tooltip: 'Extract a coordinate or angle from a Location.', helpUrl: '' },
    { type: 'location_get_world', message0: 'get world name of location %1', args0: [{ type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, output: 'String', colour: 290, tooltip: 'Returns the name of the world the location is in.', helpUrl: '' },
    { type: 'location_get_block_type', message0: 'get block type at location %1', args0: [{ type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, output: 'String', colour: 290, tooltip: 'Returns the material name of the block at the given location.', helpUrl: '' },
    { type: 'location_add', message0: 'location %1 offset  x: %2  y: %3  z: %4', args0: [{ type: 'input_value', name: 'LOCATION', check: 'Location' }, { type: 'input_value', name: 'X', check: 'Number' }, { type: 'input_value', name: 'Y', check: 'Number' }, { type: 'input_value', name: 'Z', check: 'Number' }], inputsInline: true, output: 'Location', colour: 290, tooltip: 'Returns a new Location offset by x, y, z.', helpUrl: '' },
    { type: 'location_distance', message0: 'distance from %1 to %2', args0: [{ type: 'input_value', name: 'LOC_A', check: 'Location' }, { type: 'input_value', name: 'LOC_B', check: 'Location' }], inputsInline: true, output: 'Number', colour: 290, tooltip: 'Returns the Euclidean distance between two locations.', helpUrl: '' }
  ].forEach(function (d) { B.Blocks[d.type] = { init: function () { this.jsonInit(d); } }; });

  // ─── item blocks ─────────────────────────────────────────────────────────────

  [
    { type: 'item_create', message0: 'item %1', args0: [{ type: 'input_value', name: 'MATERIAL', check: 'String' }], inputsInline: true, output: 'ItemStack', colour: 345, tooltip: 'Create an ItemStack with 1 of the given material.', helpUrl: '' },
    { type: 'item_create_with_amount', message0: 'item %1 amount %2', args0: [{ type: 'input_value', name: 'MATERIAL', check: 'String' }, { type: 'input_value', name: 'AMOUNT', check: 'Number' }], inputsInline: true, output: 'ItemStack', colour: 345, tooltip: 'Create an ItemStack with the given material and amount.', helpUrl: '' },
    { type: 'item_get_type', message0: 'get type of %1', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }], inputsInline: true, output: 'String', colour: 345, tooltip: 'Returns the material name of the item.', helpUrl: '' },
    { type: 'item_get_amount', message0: 'get amount of %1', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }], inputsInline: true, output: 'Number', colour: 345, tooltip: 'Returns the stack size of the item.', helpUrl: '' },
    { type: 'item_is_air', message0: 'is %1 air or null', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }], inputsInline: true, output: 'Boolean', colour: 345, tooltip: 'Returns true if the item is null or of type AIR.', helpUrl: '' },
    { type: 'item_set_display_name', message0: 'set display name of %1 to %2', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }, { type: 'input_value', name: 'NAME', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 345, tooltip: "Sets the item's display name.", helpUrl: '' },
    { type: 'item_set_lore', message0: 'set lore of %1 to %2', args0: [{ type: 'input_value', name: 'ITEM', check: 'ItemStack' }, { type: 'input_value', name: 'LORE', check: 'String' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 345, tooltip: 'Sets the lore of the item. Use \\n to separate lines.', helpUrl: '' }
  ].forEach(function (d) { B.Blocks[d.type] = { init: function () { this.jsonInit(d); } }; });

  // ─── world blocks ─────────────────────────────────────────────────────────────

  [
    { type: 'world_get', message0: 'get world %1', args0: [{ type: 'input_value', name: 'NAME', check: 'String' }], inputsInline: true, output: 'World', colour: 120, tooltip: 'Returns a World by its name.', helpUrl: '' },
    { type: 'world_get_block_at', message0: 'get block in %1 at %2', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }, { type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, output: 'Block', colour: 120, tooltip: 'Returns the Block at the given location in the world.', helpUrl: '' },
    { type: 'world_spawn_entity', message0: 'spawn %1 in %2 at %3', args0: [{ type: 'input_value', name: 'ENTITY_TYPE', check: 'String' }, { type: 'input_value', name: 'WORLD', check: 'World' }, { type: 'input_value', name: 'LOCATION', check: 'Location' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 120, tooltip: 'Spawn an entity in the world at the given location.', helpUrl: '' },
    { type: 'world_get_time', message0: 'get time of %1', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }], inputsInline: true, output: 'Number', colour: 120, tooltip: "Returns the world's current game time (0-24000).", helpUrl: '' },
    { type: 'world_set_time', message0: 'set time of %1 to %2', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }, { type: 'input_value', name: 'TIME', check: 'Number' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 120, tooltip: 'Set the world time.', helpUrl: '' },
    { type: 'world_get_weather', message0: 'is %1 storming', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }], inputsInline: true, output: 'Boolean', colour: 120, tooltip: 'Returns true if the world currently has a storm.', helpUrl: '' },
    { type: 'world_set_weather', message0: 'set storm in %1 to %2', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }, { type: 'input_value', name: 'STORM', check: 'Boolean' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: 120, tooltip: 'Enable or disable storm in the world.', helpUrl: '' },
    { type: 'world_get_players', message0: 'get players in %1', args0: [{ type: 'input_value', name: 'WORLD', check: 'World' }], inputsInline: true, output: null, colour: 120, tooltip: 'Returns a List of players currently in the world.', helpUrl: '' }
  ].forEach(function (d) { B.Blocks[d.type] = { init: function () { this.jsonInit(d); } }; });

  // ─── command blocks ───────────────────────────────────────────────────────────

  B.Blocks['command'] = {
    init: function () {
      this.appendDummyInput().appendField('on command do');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(65); this.setTooltip('Handles a plugin command (override onCommand).'); this.setHelpUrl('');
    }
  };

  [
    { type: 'command_get', message0: 'command sender', args0: [], output: null, colour: 65, tooltip: 'Returns the CommandSender who executed the command.', helpUrl: '' },
    { type: 'command_player', message0: 'command player (sender as Player)', args0: [], output: 'Player', colour: 65, tooltip: 'Casts the command sender to Player.', helpUrl: '' },
    { type: 'command_check_sender_is_player', message0: 'sender is a player', args0: [], output: 'Boolean', colour: 65, tooltip: 'Returns true if the command was sent by a player.', helpUrl: '' },
    { type: 'command_arg', message0: 'get arg at index %1', args0: [{ type: 'input_value', name: 'INDEX', check: 'Number' }], inputsInline: true, output: 'String', colour: 65, tooltip: 'Returns the argument string at the given index (0-based).', helpUrl: '' },
    { type: 'command_args_length', message0: 'number of args', args0: [], output: 'Number', colour: 65, tooltip: 'Returns the number of arguments passed to the command.', helpUrl: '' },
    { type: 'command_has_args', message0: 'has any args', args0: [], output: 'Boolean', colour: 65, tooltip: 'Returns true if at least one argument was passed.', helpUrl: '' }
  ].forEach(function (d) {
    B.Blocks[d.type] = Object.assign({ init: function () { this.jsonInit(d); } }, CMD_CHECK);
  });

  console.log('[Plocky] plocky_blocks.js loaded (' + Object.keys(B.Blocks).length + ' total blocks)');
})();
