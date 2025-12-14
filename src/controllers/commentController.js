// backend/src/controllers/commentController.js
import { CommentService } from "../services/commentService.js";
import { db } from "../config/database.js";

export class CommentController {
  // Crear comentario desde ruta anidada: POST /api/articles/:articleId/comments
  static async create(req, res, next) {
    try {
      const { articleId } = req.params;
      const raw =
        req.body?.comment ?? req.body?.content ?? req.body?.contenido ?? "";
      const content = typeof raw === "string" ? raw : String(raw ?? "");
      if (!content || content.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Comment content is required" });
      }

      // Validar que el artículo exista
      const { data: articleRow, error: articleErr } = await db
        .from("articles")
        .select("id")
        .eq("id", articleId)
        .single();
      if (articleErr || !articleRow) {
        return res
          .status(404)
          .json({ success: false, message: "Artículo no encontrado" });
      }

      const commentData = {
        content,
        userId: req.user.id,
        articleId,
      };

      const comment = await CommentService.create(commentData);

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: comment.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear comentario desde raíz: POST /api/comments
   * Body: { article_id: uuid, comment: string }
   * Requiere autenticación; valida que el artículo exista; devuelve comentario con datos de usuario
   */
  static async createRoot(req, res, next) {
    try {
      const { article_id, comment: rawComment } = req.body || {};
      const content =
        typeof rawComment === "string" ? rawComment : String(rawComment ?? "");

      if (!article_id) {
        return res
          .status(400)
          .json({ success: false, message: "article_id es requerido" });
      }
      if (!content || content.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "comment es requerido" });
      }

      // Validar que el artículo exista
      const { data: articleRow, error: articleErr } = await db
        .from("articles")
        .select("id")
        .eq("id", article_id)
        .single();
      if (articleErr || !articleRow) {
        return res
          .status(404)
          .json({ success: false, message: "Artículo no encontrado" });
      }

      const commentData = {
        content,
        userId: req.user.id,
        articleId: article_id,
      };

      const comment = await CommentService.create(commentData);

      return res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: comment.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener comentarios de un artículo
  static async getCommentsByArticle(req, res, next) {
    try {
      const { articleId: rawArticleId } = req.params;
      const {
        limit: rawLimit = 5,
        before: rawBefore,
        after: rawAfter,
      } = req.query;

      // Forzar logs aquí para ver valor real que llega de Express
      console.log(
        "DEBUG params typeof:",
        typeof req.params.articleId,
        "value:",
        req.params.articleId,
      );
      console.log("DEBUG route params object:", req.params);

      if (process.env.NODE_ENV !== "production") {
        console.debug(
          "[CommentController.getCommentsByArticle] params:",
          req.params,
          "query:",
          req.query,
        );
      }

      // Normalizar articleId en caso de recibir un objeto en lugar de string
      let articleId = rawArticleId;
      if (rawArticleId && typeof rawArticleId === "object") {
        articleId =
          rawArticleId.id ||
          rawArticleId._id ||
          rawArticleId.articleId ||
          rawArticleId.toString?.();
      }

      const articleIdStr = String(articleId);
      const uuidLike = /^[0-9a-fA-F-]{36}$/;
      if (
        !articleIdStr ||
        articleIdStr === "[object Object]" ||
        !uuidLike.test(articleIdStr)
      ) {
        return res.status(400).json({
          success: false,
          message: "Parámetro articleId inválido. Debe ser un UUID",
        });
      }

      // Normalización robusta de query params
      const pickFirst = (v) => (Array.isArray(v) ? v[0] : v);
      const toNumber = (v, def) => {
        const n = Number(pickFirst(v));
        return Number.isFinite(n) ? n : def;
      };
      const toStringOpt = (v) => {
        const val = pickFirst(v);
        return typeof val === "string" ? val : undefined;
      };

      let pageSize = toNumber(rawLimit, 10);
      pageSize = Math.min(Math.max(1, pageSize), 50); // rango 1..50
      const before = toStringOpt(rawBefore);
      const after = toStringOpt(rawAfter);

      const { items, total } = await CommentService.findByArticleId(
        articleIdStr,
        { limit: pageSize, before, after },
      );

      // Ensure newest-first ordering
      const sorted = [...items].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      const hasMore = sorted.length === pageSize;
      const lastComment = sorted[sorted.length - 1];

      res.status(200).json({
        success: true,
        data: sorted.map((c) => c.toJSON()),
        pagination: {
          limit: pageSize,
          hasMore,
          total,
          nextCursor: hasMore ? lastComment.created_at : null,
          previousCursor: items[0]?.created_at || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener comentario por ID
  static async getById(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comentario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: comment.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar comentario
  static async update(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comentario no encontrado",
        });
      }

      // Verificar que el usuario sea el propietario
      if (comment.userId !== req.user.id && req.user.rol !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this comment",
        });
      }

      const raw =
        req.body?.comment ?? req.body?.content ?? req.body?.contenido ?? "";
      const content = typeof raw === "string" ? raw : String(raw ?? "");
      if (!content || content.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "comment es requerido" });
      }

      const updatedComment = await CommentService.update(req.params.id, {
        content,
      });

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar comentario
  static async delete(req, res, next) {
    try {
      const comment = await CommentService.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comentario no encontrado",
        });
      }

      // Verificar que el usuario sea el propietario o admin
      if (comment.userId !== req.user.id && req.user.rol !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this comment",
        });
      }

      await CommentService.delete(req.params.id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
