import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateItemRequest, UpdateItemRequest, ItemsResponse, ItemResponse, ItemFilters } from '../types';

export class TaskController {
  // GET /tasks?done=true|false&list_id=123
  static async getTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          items: [],
          total: 0
        });
      }

      const { done, priority, list_id, limit = '50', offset = '0' } = req.query;
      
      // Construir query - buscar através das listas do usuário
      let query = supabase
        .from('to_do_item')
        .select(`
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `, { count: 'exact' })
        .eq('to_do_list.owner_id', parseInt(req.user.id))
        .order('id', { ascending: false });

      // Aplicar filtros
      if (done !== undefined) {
        query = query.eq('done', done === 'true');
      }

      if (list_id) {
        query = query.eq('list_id', parseInt(list_id as string));
      }

      if (priority && ['low', 'medium', 'high'].includes(priority as string)) {
        query = query.eq('priority', priority);
      }

      // Aplicar paginação
      const limitNum = parseInt(limit as string) || 50;
      const offsetNum = parseInt(offset as string) || 0;
      
      query = query.range(offsetNum, offsetNum + limitNum - 1);

      const { data: items, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar tarefas',
          items: [],
          total: 0
        });
      }

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) encontrada(s)`,
        items: items || [],
        total: count || 0
      });

    } catch (error) {
      console.error('Erro ao obter tarefas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        items: [],
        total: 0
      });
    }
  }

  // GET /tasks/pending
  static async getPendingTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          items: [],
          total: 0
        });
      }

      const { data: items, error, count } = await supabase
        .from('to_do_item')
        .select(`
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `, { count: 'exact' })
        .eq('to_do_list.owner_id', parseInt(req.user.id))
        .eq('done', false)
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas pendentes:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar tarefas pendentes',
          items: [],
          total: 0
        });
      }

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) pendente(s) encontrada(s)`,
        items: items || [],
        total: count || 0
      });

    } catch (error) {
      console.error('Erro ao obter tarefas pendentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        items: [],
        total: 0
      });
    }
  }

  // GET /tasks/completed
  static async getCompletedTasks(req: Request, res: Response<ItemsResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          items: [],
          total: 0
        });
      }

      const { data: items, error, count } = await supabase
        .from('to_do_item')
        .select(`
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `, { count: 'exact' })
        .eq('to_do_list.owner_id', parseInt(req.user.id))
        .eq('done', true)
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas concluídas:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao buscar tarefas concluídas',
          items: [],
          total: 0
        });
      }

      res.json({
        success: true,
        message: `${items?.length || 0} tarefa(s) concluída(s) encontrada(s)`,
        items: items || [],
        total: count || 0
      });

    } catch (error) {
      console.error('Erro ao obter tarefas concluídas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        items: [],
        total: 0
      });
    }
  }

  // POST /lists/:listId/items - Criar nova tarefa em uma lista
  static async createTask(req: Request<{ listId: string }, ItemResponse, CreateItemRequest>, res: Response<ItemResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { listId } = req.params;
      const { name, description } = req.body;

      // Verificar se a lista pertence ao usuário
      const { data: list, error: listError } = await supabase
        .from('to_do_list')
        .select('id')
        .eq('id', parseInt(listId))
        .eq('owner_id', parseInt(req.user.id))
        .single();

      if (listError || !list) {
        return res.status(404).json({
          success: false,
          message: 'Lista não encontrada'
        });
      }

      // Obter próximo item_order
      const { data: lastItem } = await supabase
        .from('to_do_item')
        .select('item_order')
        .eq('list_id', parseInt(listId))
        .order('item_order', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (lastItem?.item_order || 0) + 1;

      const { data: newItem, error } = await supabase
        .from('to_do_item')
        .insert([
          {
            list_id: parseInt(listId),
            name,
            description,
            item_order: nextOrder,
            done: false
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao criar tarefa'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Tarefa criada com sucesso',
        item: newItem
      });

    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // PUT /tasks/:id/complete
  static async completeTask(req: Request, res: Response<ItemResponse>) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { id } = req.params;

      const { data: updatedItem, error } = await supabase
        .from('to_do_item')
        .update({ 
          done: true
        })
        .eq('id', parseInt(id))
        .eq('to_do_list.owner_id', parseInt(req.user.id))
        .select(`
          *,
          to_do_list!inner (
            id,
            owner_id
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao completar tarefa:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao completar tarefa'
        });
      }

      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: 'Tarefa não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Tarefa marcada como concluída',
        item: updatedItem
      });

    } catch (error) {
      console.error('Erro ao completar tarefa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // DELETE /tasks/:id
  static async deleteTask(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const { id } = req.params;

      const { error } = await supabase
        .from('to_do_item')
        .delete()
        .eq('id', parseInt(id))
        .eq('to_do_list.owner_id', parseInt(req.user.id));

      if (error) {
        console.error('Erro ao deletar tarefa:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor ao deletar tarefa'
        });
      }

      res.json({
        success: true,
        message: 'Tarefa deletada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}